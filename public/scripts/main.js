class NBAStatsApp{
    constructor()
    {
        this.selectedPlayers = [];
        this.isLoading = false;
       
        this.suggestTimer = null;
        this.suggestRequest = 0;
        this.errorTimer = null;
        this.initializeEventListeners();


    }

    initializeEventListeners()
    {
        const searchBtn = document.getElementById('search-btn');
        const searchInput = document.getElementById('player-search');

        searchBtn.addEventListener('click', ()=> this.searchPlayer());
        searchInput.addEventListener('keypress',(e)=>{
            if(e.key === 'Enter')this.searchPlayer();
        });

        document.getElementById('clear-1').addEventListener('click', () => this.clearSlot(1));
        document.getElementById('clear-2').addEventListener('click', () => this.clearSlot(2));
        searchInput.addEventListener('input', () => this.queueSuggestions());
        document.addEventListener('click', (e) => {
            if(!e.target.closest('.search-wrap')) this.hideSuggestions();
        });
    }

        async searchPlayer(playerId = null)
    {
        const searchInput = document.getElementById('player-search');
        const searchBtn = document.getElementById('search-btn');
        const playerName = searchInput.value.trim();

        if(!playerName || this.isLoading) return;

        this.hideSuggestions();
        this.hideError();

        // the card that will receive the new player
        const slot = this.selectedPlayers.length < 2 ? this.selectedPlayers.length + 1 : 2;

        this.isLoading = true;
        searchBtn.disabled = true;
        this.showLoading(slot);

        try{
            const query = playerId || playerName;
            const response = await fetch(`/api/players/search/${encodeURIComponent(query)}`);
            const playerData = await response.json();

            if(!response.ok) throw new Error(playerData.error || 'Player not found');

            this.addPlayerToComparison(playerData);
            searchInput.value = '';
        }catch (error){
            console.error('Error searching player:', error);
            this.showError(
                error.message === 'Failed to fetch'
                    ? 'Could not reach the server. Is it running?'
                    : error.message
            );
            this.restoreSlot(slot);
        }finally{
            this.isLoading = false;
            searchBtn.disabled = false;
        }
    }
    addPlayerToComparison(playerData)
    {
        if(this.selectedPlayers.length < 2)
        {
            this.selectedPlayers.push(playerData);
            this.updatePlayerCard(this.selectedPlayers.length, playerData);
        }
        else
        {
            this.selectedPlayers[0] = this.selectedPlayers[1];
            this.selectedPlayers[1] = playerData;
            this.updatePlayerCard(1, this.selectedPlayers[0]);
            this.updatePlayerCard(2, playerData);
        }
        this.highlightWinners();
    }
    updatePlayerCard(cardNumber, playerData)
    {
        const card = document.getElementById(`player${cardNumber}-card`);
        const statsDisplay = card.querySelector('.stats-display');

        card.querySelector('h3').textContent = playerData.name;
        const photo = card.querySelector('.player-photo');
        photo.style.display = 'block';
        photo.onerror = () => { photo.style.display = 'none'; };
        photo.alt = playerData.name;
        photo.src = playerData.imageUrl;

        statsDisplay.innerHTML = `
            <div class="stat-item" data-stat="ppg">
                <span class="stat-label">PPG:</span>
                <span class="stat-value">${playerData.stats.ppg}</span>
            </div>
            <div class="stat-item" data-stat="rpg">
                <span class="stat-label">RPG:</span>
                <span class="stat-value">${playerData.stats.rpg}</span>
            </div>
            <div class="stat-item" data-stat="apg">
                <span class="stat-label">APG:</span>
                <span class="stat-value">${playerData.stats.apg}</span>
            </div>
            <div class="stat-item" data-stat="spg">
                <span class="stat-label">SPG:</span>
                <span class="stat-value">${playerData.stats.spg}</span>
            </div>
             <div class="stat-item" data-stat="bpg">
                <span class="stat-label">BPG:</span>
                <span class="stat-value">${playerData.stats.bpg}</span>
            </div>
            <div class="stat-item" data-stat="fg">
                <span class="stat-label">FG%:</span>
                <span class="stat-value">${playerData.stats.fg}%</span>
            </div>
             <div class="stat-item" data-stat="fg3">
                <span class="stat-label">3PT%:</span>
                <span class="stat-value">${playerData.stats.fg3}%</span>
            </div>
             <div class="stat-item" data-stat="ft">
                <span class="stat-label">FT%:</span>
                <span class="stat-value">${playerData.stats.ft}%</span>
            </div>
        `;
        card.querySelector('.clear-btn').style.display = 'block';

    }

        showLoading(slot)
    {
        const card = document.getElementById(`player${slot}-card`);
        card.querySelector('.player-photo').style.display = 'none';
        card.querySelector('.clear-btn').style.display = 'none';
        card.querySelector('.stats-display').innerHTML =
            '<div class="spinner"></div><p class="loading-label">LOADING...</p>';
        document.querySelectorAll('.stat-item.winner')
            .forEach(el => el.classList.remove('winner'));
                
    }

    restoreSlot(slot)
    {
        const player = this.selectedPlayers[slot - 1];
        const card = document.getElementById(`player${slot}-card`);

        if(player)
        {
            this.updatePlayerCard(slot, player);
            this.highlightWinners();
        }
        else
        {
            card.querySelector('h3').textContent = `Player ${slot}`;
            card.querySelector('.stats-display').innerHTML = '';
        }
    }

    highlightWinners() {
    if (this.selectedPlayers.length < 2) return;
    const [p1, p2] = this.selectedPlayers;

    document.querySelectorAll('.stat-item.winner')
        .forEach(el => el.classList.remove('winner'));

    ['ppg', 'rpg', 'apg', 'spg', 'bpg', 'fg', 'fg3', 'ft'].forEach(stat => {
        const a = parseFloat(p1.stats[stat]);
        const b = parseFloat(p2.stats[stat]);
        if (a === b) return;
        const winnerCard = a > b ? 'player1-card' : 'player2-card';
        document
            .querySelector(`#${winnerCard} [data-stat="${stat}"]`)
            .classList.add('winner');
        });
    }


    clearSlot(slot)
    {
        // remove that player; if player 2 remains, they move into slot 1
        this.selectedPlayers.splice(slot - 1, 1);

        // wipe both cards, then redraw whoever is left
        this.resetCard(1);
        this.resetCard(2);

        this.selectedPlayers.forEach((player, index) => {
            this.updatePlayerCard(index + 1, player);
        });

        // the green highlights only make sense with two players
        document.querySelectorAll('.stat-item.winner')
            .forEach(el => el.classList.remove('winner'));
        if(this.selectedPlayers.length === 2) this.highlightWinners();
    }

    resetCard(slot)
    {
        const card = document.getElementById(`player${slot}-card`);
        card.querySelector('h3').textContent = `Player ${slot}`;
        card.querySelector('.player-photo').style.display = 'none';
        card.querySelector('.stats-display').innerHTML = '';
        card.querySelector('.clear-btn').style.display = 'none';
    }

        queueSuggestions()
    {
        clearTimeout(this.suggestTimer);
        const query = document.getElementById('player-search').value.trim();

        if(query.length < 2)
        {
            this.hideSuggestions();
            return;
        }

        // wait until typing pauses so we don't ask the server on every keystroke
        this.suggestTimer = setTimeout(() => this.loadSuggestions(query), 350);
    }

    async loadSuggestions(query)
    {
        const requestId = ++this.suggestRequest;

        try{
            const response = await fetch(`/api/players/suggest/${encodeURIComponent(query)}`);
            const results = await response.json();

            // ignore this answer if a newer search has started since
            if(requestId !== this.suggestRequest) return;
            if(!response.ok) return this.hideSuggestions();

            this.showSuggestions(results);
        }catch(error){
            this.hideSuggestions();
        }
    }

    showSuggestions(results)
    {
        const box = document.getElementById('suggestions');
        box.innerHTML = '';

        if(results.length === 0)
        {
            const empty = document.createElement('div');
            empty.className = 'suggestion-empty';
            empty.textContent = 'No players found';
            box.appendChild(empty);
        }

        results.forEach(player => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';

            const name = document.createElement('span');
            name.textContent = player.name;
            item.appendChild(name);

            if(!player.active)
            {
                const tag = document.createElement('span');
                tag.className = 'suggestion-tag';
                tag.textContent = 'Retired';
                item.appendChild(tag);
            }

            item.addEventListener('click', () => {
                document.getElementById('player-search').value = player.name;
                this.hideSuggestions();
                this.searchPlayer(player.id);
            });
            box.appendChild(item);
        });

        box.classList.add('open');
    }

    hideSuggestions()
    {
        // bumping the counter also cancels any answer still on its way
        this.suggestRequest++;
        clearTimeout(this.suggestTimer);
        const box = document.getElementById('suggestions');
        box.classList.remove('open');
        box.innerHTML = '';
    }

        showError(message)
    {
        const el = document.getElementById('error-message');
        el.textContent = message;
        el.classList.add('show');

        // fade away on its own after 5 seconds
        clearTimeout(this.errorTimer);
        this.errorTimer = setTimeout(() => this.hideError(), 5000);
    }

    hideError()
    {
        clearTimeout(this.errorTimer);
        document.getElementById('error-message').classList.remove('show');
    }
}

    document.addEventListener('DOMContentLoaded', () =>{
        new NBAStatsApp();
    });

