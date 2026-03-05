export interface Playlist {
  id: string;
  name: string;
  owner: string;
  trackCount: number;
  coverColors: [string, string, string, string]; // 4 quadrant colors for mosaic
}

export const likedSongs = {
  count: 1008,
};

export const playlists: Playlist[] = [
  { id: "1", name: "Randomized Liked Songs", owner: "Oscar Ibarra", trackCount: 1006, coverColors: ["#e74c3c", "#3498db", "#f39c12", "#2ecc71"] },
  { id: "2", name: "New Randomized Playlist", owner: "Oscar Ibarra", trackCount: 1005, coverColors: ["#9b59b6", "#e67e22", "#1abc9c", "#e74c3c"] },
  { id: "3", name: "February Randomized Liked Songs", owner: "Oscar Ibarra", trackCount: 1006, coverColors: ["#e74c3c", "#f1c40f", "#3498db", "#e91e63"] },
  { id: "4", name: "Jan Randomized Liked Songs", owner: "Oscar Ibarra", trackCount: 984, coverColors: ["#8e44ad", "#e91e63", "#f39c12", "#27ae60"] },
  { id: "5", name: "December Randomized Liked Songs", owner: "Oscar Ibarra", trackCount: 980, coverColors: ["#2c3e50", "#16a085", "#c0392b", "#8e44ad"] },
  { id: "6", name: "Good Listens", owner: "Oscar Ibarra", trackCount: 24, coverColors: ["#d35400", "#c0392b", "#2c3e50", "#f39c12"] },
  { id: "7", name: "December Randomized Liked Songs Vol 2", owner: "Oscar Ibarra", trackCount: 966, coverColors: ["#34495e", "#1abc9c", "#e74c3c", "#9b59b6"] },
  { id: "8", name: "November Randomized Liked Songs", owner: "Oscar Ibarra", trackCount: 988, coverColors: ["#2ecc71", "#3498db", "#e74c3c", "#f1c40f"] },
  { id: "9", name: "Best Friends Forever 2025", owner: "S&S Presents", trackCount: 81, coverColors: ["#e91e63", "#ff5722", "#ff9800", "#ffc107"] },
  { id: "10", name: "October Randomized Liked Songs", owner: "Oscar Ibarra", trackCount: 961, coverColors: ["#607d8b", "#795548", "#9e9e9e", "#455a64"] },
  { id: "11", name: "September Randomized Liked Songs", owner: "Oscar Ibarra", trackCount: 955, coverColors: ["#e74c3c", "#3f51b5", "#009688", "#ff5722"] },
  { id: "12", name: "September Randomized Liked Songs Vol 2", owner: "Oscar Ibarra", trackCount: 952, coverColors: ["#ff4081", "#536dfe", "#00bcd4", "#ff6e40"] },
  { id: "13", name: "I was Manu", owner: "Oscar Ibarra", trackCount: 45, coverColors: ["#263238", "#37474f", "#455a64", "#546e7a"] },
  { id: "14", name: "Pepper — No Shame", owner: "Oscar Ibarra", trackCount: 12, coverColors: ["#ffeb3b", "#ff9800", "#f44336", "#e91e63"] },
  { id: "15", name: "NOFX — Wolves In Wolves' Clothing", owner: "Oscar Ibarra", trackCount: 18, coverColors: ["#b71c1c", "#880e4f", "#4a148c", "#1a237e"] },
];
