const API_BASE_URL = "http://127.0.0.1:8000";

const form = document.getElementById("predictionForm");
const predictBtn = document.getElementById("predictBtn");
const exampleBtn = document.getElementById("exampleBtn");
const emptyState = document.getElementById("emptyState");
const resultState = document.getElementById("resultState");
const predictionEl = document.getElementById("prediction");
const probabilitiesEl = document.getElementById("probabilities");
const topConfidenceEl = document.getElementById("topConfidence");
const resultMessageEl = document.getElementById("resultMessage");
const toast = document.getElementById("toast");

const classNames = ["Entire home/apt", "Private room", "Shared room"];

function showToast(message, isError = false) {
  toast.textContent = message;
  toast.className = "toast" + (isError ? " error" : "");
  setTimeout(() => toast.classList.add("hidden"), 3500);
}

function checkApi() {
  fetch(`${API_BASE_URL}/`)
    .then(res => {
      if (!res.ok) throw new Error();
      document.getElementById("apiStatus").textContent = "API Connected";
      document.getElementById("apiDot").classList.remove("offline");
    })
    .catch(() => {
      document.getElementById("apiStatus").textContent = "API Offline";
      document.getElementById("apiDot").classList.add("offline");
    });
}

exampleBtn.addEventListener("click", () => {
  const example = {
    latitude: 40.7128,
    longitude: -74.0060,
    price: 150,
    minimum_nights: 2,
    number_of_reviews: 35,
    reviews_per_month: 1.2,
    calculated_host_listings_count: 1,
    availability_365: 120,
    neighbourhood_group: "Manhattan",
    neighbourhood: "Harlem"
  };
  Object.entries(example).forEach(([key, value]) => form.elements[key].value = value);
  showToast("Example data filled successfully!");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  ["latitude", "longitude", "price", "reviews_per_month"].forEach(k => payload[k] = Number(payload[k]));
  ["minimum_nights", "number_of_reviews", "calculated_host_listings_count", "availability_365"]
    .forEach(k => payload[k] = Number.parseInt(payload[k], 10));

  predictBtn.disabled = true;
  predictBtn.innerHTML = "<span>Predicting...</span><span>⌛</span>";

  try {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail ? JSON.stringify(error.detail) : "Prediction request failed");
    }

    const result = await response.json();
    const probs = result.Probability || [];
    const prediction = result.Predicted_room_type || "Unknown";

    emptyState.classList.add("hidden");
    resultState.classList.remove("hidden");
    predictionEl.textContent = prediction;

    const maxProbability = probs.length ? Math.max(...probs) : 0;
    resultMessageEl.textContent = `The model is most confident about this classification.`;
    topConfidenceEl.textContent = `${(maxProbability * 100).toFixed(1)}% confidence`;

    probabilitiesEl.innerHTML = probs.map((prob, index) => `
      <div class="prob-row">
        <span>${classNames[index] || `Class ${index + 1}`}</span>
        <div class="bar"><div class="fill" style="width:${Math.max(0, Math.min(100, prob * 100))}%"></div></div>
        <strong>${(prob * 100).toFixed(1)}%</strong>
      </div>
    `).join("");

    checkApi();
  } catch (error) {
    console.error(error);
    showToast("Prediction failed. Make sure FastAPI is running.", true);
  } finally {
    predictBtn.disabled = false;
    predictBtn.innerHTML = "<span>Predict Room Type</span><span>→</span>";
  }
});

checkApi();
setInterval(checkApi, 10000);
