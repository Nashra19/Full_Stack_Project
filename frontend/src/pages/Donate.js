// frontend/src/pages/Donate.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Donate.css";

const Donate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Card selects
  const [donateFood, setDonateFood] = useState(false);
  const [donateGrocery, setDonateGrocery] = useState(false);

  // Food form
  const [food, setFood] = useState({
    dishName: "",
    servings: "",
    pickupLocation: "",
    bestBefore: "",
    notes: "",
    imageDataUrl: "", // base64 preview/upload
    fullAddress: "",
    category: "prepared",
    foodType: "veg",
  });

  // Grocery form
  const [grocery, setGrocery] = useState({
    itemName: "",
    quantity: "",
    unit: "kg",
    expiryDate: "",
    pickupLocation: "",
    notes: "",
    imageDataUrl: "", // base64 preview/upload
    fullAddress: "",
    category: "other",
    foodType: "veg",
  });

  // UI state
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [error, setError] = useState("");

  const nothingSelected = !donateFood && !donateGrocery;

  const handleFoodChange = (e) => {
    const { name, value } = e.target;
    setFood((prev) => ({ ...prev, [name]: value }));
  };

  const handleGroceryChange = (e) => {
    const { name, value } = e.target;
    setGrocery((prev) => ({ ...prev, [name]: value }));
  };

  const handleFoodImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const maxBytes = 1024 * 1024 * 2; // 2MB
    if (file.size > maxBytes) {
      setError("Image too large. Please choose a file under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFood((prev) => ({ ...prev, imageDataUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // current location feature removed per request

  const validate = () => {
    if (nothingSelected) return "Please select at least one donation type.";
    if (donateFood) {
      if (!food.dishName.trim()) return "Please enter a dish name.";
      if (!food.servings || Number(food.servings) <= 0)
        return "Please enter servings (> 0).";
      if (!food.pickupLocation.trim())
        return "Please enter pickup location for cooked food.";
      if (!food.bestBefore) return "Please select best-before time.";
    }
    if (donateGrocery) {
      if (!grocery.itemName.trim()) return "Please enter grocery item name.";
      if (!grocery.quantity || Number(grocery.quantity) <= 0)
        return "Please enter a valid quantity.";
      if (!grocery.expiryDate) return "Please select expiry date.";
      if (!grocery.pickupLocation.trim())
        return "Please enter pickup location for grocery.";
    }
    return "";
  };

  const handlePreview = (e) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError("");
    setShowPreview(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setSubmitting(true);
    setError("");

    const payload = {
      type: donateFood ? "cooked" : "grocery",
      items: donateFood
        ? {
            dishName: food.dishName,
            servings: food.servings,
            bestBefore: food.bestBefore,
            notes: food.notes,
            image: food.imageDataUrl || undefined,
          }
        : {
            itemName: grocery.itemName,
            quantity: grocery.quantity,
            unit: grocery.unit,
            expiryDate: grocery.expiryDate,
            notes: grocery.notes,
            image: grocery.imageDataUrl || undefined, // ✅ FIX: Added grocery image to the payload
          },
      pickupAddress: donateFood
        ? food.pickupLocation
        : grocery.pickupLocation,
      fullAddress: donateFood ? food.fullAddress : grocery.fullAddress,
      contact: "9876543210", // later: pull from profile
      category: donateFood ? food.category : grocery.category,
      foodType: donateFood ? food.foodType : grocery.foodType,
    };

    try {
      const res = await fetch("http://localhost:5000/api/donations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save donation");
      }

      setSuccessOpen(true);
      setTimeout(() => {
        if (user?.role === 'RECEIVER') {
          navigate("/receiver-dashboard");
        } else {
          navigate("/dashboard");
        }
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="donate-page">
      {/* Header */}
      <header className="donate-hero">
        <div>
          <h1>Start Donating</h1>
          <p>Choose what you’d like to donate today. You can select one or both.</p>
        </div>
        <button className="link-btn" onClick={() => navigate(-1)}>← Back</button>
      </header>

      {/* Type Select */}
      <section className="type-select">
        <div
          className={`type-card ${donateFood ? "active" : ""}`}
          onClick={() => setDonateFood((s) => !s)}
        >
          <img src="cookedfood.webp" alt="Cooked Food" />
          <h3>Cooked Food</h3>
          <p>Share meals that are fresh and safe to eat.</p>
          <div className="check">{donateFood ? "Selected ✓" : "Select"}</div>
        </div>

        <div
          className={`type-card ${donateGrocery ? "active" : ""}`}
          onClick={() => setDonateGrocery((s) => !s)}
        >
          <img src="comicGrocery.png" alt="Grocery Items" />
          <h3>Grocery Items</h3>
          <p>Donate sealed/packaged or fresh grocery items.</p>
          <div className="check">{donateGrocery ? "Selected ✓" : "Select"}</div>
        </div>
      </section>

      {error && <div className="form-error">{error}</div>}

      {/* Forms */}
      <form className="forms" onSubmit={handlePreview}>
        {donateFood && (
          <div className="form-card">
            <div className="form-card-head">
              <img src="smallimg.png" alt="" />
              <h4>Cooked Food Details</h4>
            </div>
            <h5 className="subsection-title">Basics</h5>
            <div className="grid-2">
              <label>
                Dish Name
                <input
                  name="dishName"
                  value={food.dishName}
                  onChange={handleFoodChange}
                />
              </label>
              <label>
                Servings
                <input
                  type="number"
                  name="servings"
                  value={food.servings}
                  onChange={handleFoodChange}
                />
              </label>
            </div>
            <h5 className="subsection-title">Pickup and Time</h5>
            <div className="grid-2">
              <label>
                Pickup Location (Short)
                <input
                  name="pickupLocation"
                  value={food.pickupLocation}
                  onChange={handleFoodChange}
                />
              </label>
              <label>
                Best Before
                <input
                  type="datetime-local"
                  name="bestBefore"
                  value={food.bestBefore}
                  onChange={handleFoodChange}
                />
              </label>
            </div>
            <h5 className="subsection-title">Address & Map</h5>
            <div className="grid-2">
              <label>
                Full Address
                <input
                  name="fullAddress"
                  value={food.fullAddress}
                  onChange={handleFoodChange}
                  placeholder="Apartment, street, city, state, postal code"
                />
              </label>
              
            </div>
            <hr className="divider" />
            <h5 className="subsection-title">Image & Notes</h5>
            <div className="grid-2">
              <label>
                Food Image 
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFoodImageChange}
                />
              </label>
              {food.imageDataUrl && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={food.imageDataUrl} alt="Preview" style={{ maxHeight: 96, borderRadius: 8 }} />
                </div>
              )}
            </div>
            <label>
              Notes
              <textarea
                name="notes"
                value={food.notes}
                onChange={handleFoodChange}
              />
            </label>
            
            <div className="grid-2">
              <label>
                Category
                <select
                  name="category"
                  value={food.category}
                  onChange={handleFoodChange}
                >
                  <option value="prepared">Prepared Food</option>
                  <option value="baked">Baked Goods</option>
                  <option value="dairy">Dairy</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label>
                Food Type
                <select
                  name="foodType"
                  value={food.foodType}
                  onChange={handleFoodChange}
                >
                  <option value="veg">Vegetarian</option>
                  <option value="non-veg">Non-Vegetarian</option>
                  <option value="vegan">Vegan</option>
                </select>
              </label>
            </div>
          </div>
        )}

        {donateGrocery && (
          <div className="form-card">
            <div className="form-card-head">
              <img src="tinygrocery.png" alt="" />
              <h4>Grocery Details</h4>
            </div>
            <h5 className="subsection-title">Basics</h5>
            <div className="grid-2">
              <label>
                Item Name
                <input
                  name="itemName"
                  value={grocery.itemName}
                  onChange={handleGroceryChange}
                />
              </label>
              <label>
                Quantity
                <input
                  type="number"
                  name="quantity"
                  value={grocery.quantity}
                  onChange={handleGroceryChange}
                />
              </label>
            </div>
            <h5 className="subsection-title">Pickup and Expiry</h5>
            <div className="grid-2">
              <label>
                Expiry Date
                <input
                  type="date"
                  name="expiryDate"
                  value={grocery.expiryDate}
                  onChange={handleGroceryChange}
                />
              </label>
              <label>
                Pickup Location (Short)
                <input
                  name="pickupLocation"
                  value={grocery.pickupLocation}
                  onChange={handleGroceryChange}
                />
              </label>
            </div>
            <h5 className="subsection-title">Address & Map</h5>
            <div className="grid-2">
              <label>
                Full Address
                <input
                  name="fullAddress"
                  value={grocery.fullAddress}
                  onChange={handleGroceryChange}
                  placeholder="Apartment, street, city, state, postal code"
                />
              </label>
              
            </div>
            <hr className="divider" />
            <h5 className="subsection-title">Image & Notes</h5>
            <div className="grid-2">
              <label>
                Grocery Image 
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files && e.target.files[0];
                    if (!file) return;
                    const maxBytes = 1024 * 1024 * 2; // 2MB
                    if (file.size > maxBytes) {
                      setError("Image too large. Please choose a file under 2MB.");
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      setGrocery((prev) => ({ ...prev, imageDataUrl: reader.result }));
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
              {grocery.imageDataUrl && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={grocery.imageDataUrl} alt="Preview" style={{ maxHeight: 96, borderRadius: 8 }} />
                </div>
              )}
            </div>
            <label>
              Notes
              <textarea
                name="notes"
                value={grocery.notes}
                onChange={handleGroceryChange}
              />
            </label>
            
            <div className="grid-2">
              <label>
                Category
                <select
                  name="category"
                  value={grocery.category}
                  onChange={handleGroceryChange}
                >
                  <option value="fruits">Fruits</option>
                  <option value="vegetables">Vegetables</option>
                  <option value="grains">Grains</option>
                  <option value="dairy">Dairy</option>
                  <option value="meat">Meat</option>
                  <option value="baked">Baked Goods</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label>
                Food Type
                <select
                  name="foodType"
                  value={grocery.foodType}
                  onChange={handleGroceryChange}
                >
                  <option value="veg">Vegetarian</option>
                  <option value="non-veg">Non-Vegetarian</option>
                  <option value="vegan">Vegan</option>
                </select>
              </label>
            </div>
          </div>
        )}

        <div className="actions-row">
          <button type="submit" className="btn primary">
            Review Details
          </button>
          <button type="button" className="btn ghost" onClick={() => {
            if (user?.role === 'RECEIVER') {
              navigate("/receiver-dashboard");
            } else {
              navigate("/dashboard");
            }
          }}>
            Cancel
          </button>
        </div>
      </form>

      {/* Preview */}
      {showPreview && (
        <div className="preview-card">
          <h3>Preview</h3>
          {donateFood && (
            <div>
              <h4>🍲 Cooked Food</h4>
              <p><b>Dish:</b> {food.dishName}</p>
              <p><b>Servings:</b> {food.servings}</p>
              <p><b>Pickup:</b> {food.pickupLocation}</p>
              <p><b>Best Before:</b> {food.bestBefore}</p>
              {food.imageDataUrl && (
                <div style={{ marginTop: 8 }}>
                  <img src={food.imageDataUrl} alt="Food preview" style={{ maxHeight: 140, borderRadius: 8 }} />
                </div>
              )}
            </div>
          )}
          {donateGrocery && (
            <div>
              <h4>🥫 Grocery</h4>
              <p><b>Item:</b> {grocery.itemName}</p>
              <p><b>Quantity:</b> {grocery.quantity} {grocery.unit}</p>
              <p><b>Expiry:</b> {grocery.expiryDate}</p>
              <p><b>Pickup:</b> {grocery.pickupLocation}</p>
              {grocery.imageDataUrl && (
                <div style={{ marginTop: 8 }}>
                  <img src={grocery.imageDataUrl} alt="Grocery preview" style={{ maxHeight: 140, borderRadius: 8 }} />
                </div>
              )}
            </div>
          )}
          <div className="actions-row">
            <button className="btn primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting…" : "Donate Now"}
            </button>
            <button className="btn ghost" onClick={() => setShowPreview(false)}>Edit</button>
          </div>
        </div>
      )}

      {/* Success Dialog */}
      {successOpen && (
        <div className="dialog">
          <div className="dialog-card">
            <div className="emoji">🎉</div>
            <h3>Thank you for donating!</h3>
            <button
              className="btn primary"
              onClick={() => {
                setSuccessOpen(false);
                if (user?.role === 'RECEIVER') {
                  navigate("/receiver-dashboard");
                } else {
                  navigate("/dashboard");
                }
              }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Donate;