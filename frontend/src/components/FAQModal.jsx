import React from 'react'
import './FAQModal.css'

function FAQModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="faq-modal-overlay" onClick={onClose}>
      <div className="faq-modal" onClick={(e) => e.stopPropagation()}>
        <div className="faq-modal-header">
          <h2>Frequently Asked Questions</h2>
          <button className="faq-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="faq-content">
          <div className="faq-item">
            <h3>How do I play Semantle?</h3>
            <p>
              Semantle is a word guessing game where you try to find the target word by guessing words and receiving similarity scores. 
              The closer your guess is semantically to the target word, the higher the similarity score.
            </p>
          </div>

          <div className="faq-item">
            <h3>What is a similarity score?</h3>
            <p>
              The similarity score represents how semantically similar your guessed word is to the target word. 
              Higher scores mean your guess is closer to the target word. Use these scores to guide your next guesses!
            </p>
          </div>

          <div className="faq-item">
            <h3>How many attempts do I have?</h3>
            <p>
              You have unlimited attempts to find the target word. However, try to solve it in as few guesses as possible to improve your statistics!
            </p>
          </div>

          <div className="faq-item">
            <h3>What is a Daily Challenge?</h3>
            <p>
              The Daily Challenge is a special game mode where everyone gets the same target word for that day. 
              Try to solve it and see how you compare with other players!
            </p>
          </div>

          <div className="faq-item">
            <h3>How are my statistics tracked?</h3>
            <p>
              Your statistics are saved to your account when you complete a game. 
              This includes total games played, completed games, average attempts, and your best score.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FAQModal
