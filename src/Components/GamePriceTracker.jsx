import { useState, useEffect } from "react";

const GamePriceTracker = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [noResults, setNoResults] = useState(false);
  const [sortOption, setSortOption] = useState("price");
  const [platformFilter, setPlatformFilter] = useState("all"); // Filter by platform (Steam, GOG, or all)
  const [minPrice, setMinPrice] = useState(""); // Minimum price filter
  const [maxPrice, setMaxPrice] = useState(""); // Maximum price filter
  const [favorites, setFavorites] = useState([]); // Store favorites

  // Fixed exchange rate (USD to EUR)
  const USD_TO_EUR_RATE = 0.85;

  useEffect(() => {
    // Load favorites from localStorage when the component mounts
    const savedFavorites = JSON.parse(localStorage.getItem("favorites")) || [];
    setFavorites(savedFavorites);
  }, []);

  const fetchGames = async (query, retries = 3) => {
    setIsLoading(true);
    setError(null);
    setNoResults(false);

    try {
      const response = await fetch(
        `https://www.cheapshark.com/api/1.0/deals?title=${query}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch game prices");
      }
      const data = await response.json();

      if (data.length === 0) {
        setNoResults(true);
      } else {
        const filteredGames = data.filter(
          (game) => game.storeID === "1" || game.storeID === "7"
        );
        setGames(filteredGames);

        if (filteredGames.length === 0) {
          setNoResults(true);
        }
      }
      setIsLoading(false);
    } catch (err) {
      if (retries > 0) {
        fetchGames(query, retries - 1);
      } else {
        setError(
          "Failed to fetch game prices after several attempts. Please try again later."
        );
        setIsLoading(false);
      }
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm) {
      setGames([]); // Clear previous results
      fetchGames(searchTerm);
    }
  };

  // Save favorites to localStorage and state
  const addToFavorites = (game) => {
    const updatedFavorites = [...favorites, game];
    setFavorites(updatedFavorites);
    localStorage.setItem("favorites", JSON.stringify(updatedFavorites)); // Save to localStorage
  };

  const removeFromFavorites = (gameID) => {
    const updatedFavorites = favorites.filter((game) => game.gameID !== gameID);
    setFavorites(updatedFavorites);
    localStorage.setItem("favorites", JSON.stringify(updatedFavorites)); // Update localStorage
  };

  const getStoreName = (storeID) => {
    const stores = {
      1: "Steam",
      7: "GOG",
    };

    return stores[storeID] || "Unknown Store"; // Return the store name or 'Unknown Store' if storeID doesn't match
  };

  // Filter and sort games based on platform, price, and sort option
  const filterAndSortGames = (games) => {
    let filteredGames = games;

    // Platform filter
    if (platformFilter !== "all") {
      filteredGames = filteredGames.filter(
        (game) => getStoreName(game.storeID) === platformFilter
      );
    }

    // Price range filter
    filteredGames = filteredGames.filter((game) => {
      const priceInEur = game.salePrice * USD_TO_EUR_RATE;
      const minPriceNum = parseFloat(minPrice) || 0;
      const maxPriceNum = parseFloat(maxPrice) || Number.MAX_SAFE_INTEGER;
      return priceInEur >= minPriceNum && priceInEur <= maxPriceNum;
    });

    // Sorting
    if (sortOption === "price") {
      return [...filteredGames].sort(
        (a, b) => parseFloat(a.salePrice) - parseFloat(b.salePrice)
      ); // Sort by price
    } else if (sortOption === "discount") {
      return [...filteredGames].sort((a, b) => b.savings - a.savings); // Sort by discount percentage
    }

    return filteredGames;
  };

  const sortedAndFilteredGames = filterAndSortGames(games);

  return (
    <div className="max-w-4xl mx-auto p-5">
      <h1 className="text-3xl font-bold text-center mb-6">
        Game Price Tracker
      </h1>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex justify-center mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for a game"
          className="border border-gray-300 p-2 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded-r-md hover:bg-blue-600 transition"
        >
          Search
        </button>
      </form>

      {/* Sorting and Filtering */}
      <div className="flex justify-center mb-6">
        <div className="mr-4">
          <label htmlFor="sort" className="mr-2">
            Sort by:
          </label>
          <select
            id="sort"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="price">Price (Low to High)</option>
            <option value="discount">Discount (High to Low)</option>
          </select>
        </div>

        <div className="mr-4">
          <label htmlFor="platform" className="mr-2">
            Platform:
          </label>
          <select
            id="platform"
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="Steam">Steam</option>
            <option value="GOG">GOG</option>
          </select>
        </div>

        <div className="mr-4">
          <label htmlFor="minPrice" className="mr-2">
            Min Price:
          </label>
          <input
            id="minPrice"
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mr-4">
          <label htmlFor="maxPrice" className="mr-2">
            Max Price:
          </label>
          <input
            id="maxPrice"
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Display the error message if there is an error */}
      {error && <div className="text-red-500 text-center mb-4">{error}</div>}

      {/* Show the spinner if loading */}
      {isLoading && <div className="text-center mb-4">Loading...</div>}

      {/* Show "No results found" if no games match the query */}
      {!isLoading && noResults && (
        <div className="text-center text-gray-600">No results found.</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {!isLoading &&
          !error &&
          !noResults &&
          sortedAndFilteredGames.map((game) => (
            <div
              key={game.gameID}
              className="bg-white shadow-md rounded-md p-4 text-center"
            >
              <h3 className="text-lg font-bold">{game.title}</h3>

              <p className="text-gray-700">
                {game.isOnSale ? (
                  <>
                    <span className="line-through text-red-500">
                      €{(game.normalPrice * USD_TO_EUR_RATE).toFixed(2)}
                    </span>{" "}
                    <span className="font-bold">
                      €{(game.salePrice * USD_TO_EUR_RATE).toFixed(2)}
                    </span>
                  </>
                ) : (
                  <>€{(game.salePrice * USD_TO_EUR_RATE).toFixed(2)}</>
                )}
              </p>

              {game.isOnSale && (
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs mt-2 inline-block">
                  On Sale!
                </span>
              )}

              <p className="text-gray-500">{getStoreName(game.storeID)}</p>

              <img
                src={game.thumb}
                alt={game.title}
                className="mx-auto my-2 rounded-md"
              />
              <button
                className="bg-green-500 text-white px-4 py-2 mt-2 rounded-md hover:bg-green-600 transition"
                onClick={() => addToFavorites(game)}
              >
                Add to Favorites
              </button>
            </div>
          ))}
      </div>

      {/* Favorites Section */}
      {favorites.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Your Favorites</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((game) => (
              <div
                key={game.gameID}
                className="bg-white shadow-md rounded-md p-4 text-center"
              >
                <h3 className="text-lg font-bold">{game.title}</h3>
                <p className="text-gray-700">
                  €{(game.salePrice * USD_TO_EUR_RATE).toFixed(2)}
                </p>
                <button
                  className="bg-red-500 text-white px-4 py-2 mt-2 rounded-md hover:bg-red-600 transition"
                  onClick={() => removeFromFavorites(game.gameID)}
                >
                  Remove from Favorites
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePriceTracker;
