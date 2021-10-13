export async function listGames() {
    const response = await fetch('/api/v1/games/list');
    return await response.json();
}
