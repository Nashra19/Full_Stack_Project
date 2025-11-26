import React from "react";
import "./HowItWorks.css";

const HowItWorks = () => {
  const steps = [
    {
      id: 1,
      icon: "/icons/surplus.jpg",
      title: "Donate Surplus Food",
      description: "List your extra food before it goes to waste and make it available to those in need."
    },
    {
      id: 2,
      icon: "/icons/connectwithreceivers.jpg",
      title: "Connect with Receivers",
      description: "NGOs, shelters, and individuals can view available food in real-time."
    },
    {
      id: 3,
      icon: "/icons/reciver.png",
      title: "Pickup & Deliver",
      description: "Volunteers or receivers collect and distribute the food quickly and safely."
    },
    {
      id: 4,
      icon:"/icons/delivery.png",
      title: "Track Your Impact",
      description: "See how much waste you’ve reduced and the number of meals you’ve helped provide."
    }
  ];

  return (
    <section className="how-it-works-page">
      <div className="hiw-hero">
        <h1>How It Works</h1>
        <p>Together, we can reduce waste and fight hunger — one meal at a time.</p>
      </div>

      <div className="steps-container">
        {steps.map((step) => (
          <div key={step.id} className="hiw-step">
            <img src={step.icon} alt={step.title} className="step-icon" />
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </div>
        ))}
      </div>

      <div className="impact-section">
        <h2>Your Impact Matters</h2>
        <p>Over <strong>2,500 kg</strong> of food saved this month alone.</p>
        <div className="progress-bar">
          <div className="progress" style={{ width: "75%" }}></div>
        </div>
      </div>

      {/* <div className="cta-section">
        <button className="yellow-btn">Start Donating</button>
      </div> */}
    </section>
  );
};

export default HowItWorks;
