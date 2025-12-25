class NBAStatsApp{
    constructor()
    {
        this.selectedPlayers = [];
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
    }

    async searchPlayer()
    {
        const searchInput = document.getElementById('player-search');
        const playerName = searchInput.Value.trim();

        if(!playerName) return;

        try{
            const response = await fetch('/api/players/search/${playerName}');
            const playerData = await response.json();

            this.addPlayerToComparison(playerData);
            searchInput.value = '';
        }catch (error){
            console.error('Error searching player:', error);
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
    }
    updatePlayerCard(cardNumber, playerData)
    {
        const card = document.getElementById(`player${cardNumber}-card`);
        const statsDisplay = card.querySelector('.stats-display');

        card.querySelector('h3').textContent = playerData.name;

        statsDisplay.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">PPG:</span>
                <span class="stat-value">${playerData.stats.ppg}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">RPG:</span>
                <span class="stat-value">${playerData.stats.rpg}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">APG:</span>
                <span class="stat-value">${playerData.stats.apg}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">FG%:</span>
                <span class="stat-value">${playerData.stats.fg}%</span>
            </div>
        `;

    }
}

    document.addEventListener('DOMContentLoaded', () =>{
        new NBAStatsApp();
    });

