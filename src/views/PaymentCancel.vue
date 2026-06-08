<template>
  <div class="payment-result">
    <div class="payment-result__card glass">
      <div class="payment-result__icon payment-result__icon--cancel">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
        </svg>
      </div>
      <h1 class="payment-result__title">Payment Cancelled</h1>
      <p class="payment-result__message">No worries. You can try again whenever you're ready.</p>
      <div class="payment-result__actions">
        <button class="payment-result__btn payment-result__btn--primary" @click="$router.push('/wallet')">
          Try Again
        </button>
        <button class="payment-result__btn" @click="$router.push('/')">
          Back to Music
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.payment-result {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  z-index: 1;

  &__card {
    max-width: 420px;
    width: 100%;
    padding: 48px 36px;
    border-radius: var(--radius-lg);
    text-align: center;
    animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  &__icon {
    margin: 0 auto 24px;

    &--cancel {
      color: var(--text-secondary);
    }
  }

  &__title {
    font-family: var(--font-display);
    font-size: 1.6rem;
    font-weight: 900;
    margin-bottom: 8px;
  }

  &__message {
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin-bottom: 32px;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__btn {
    width: 100%;
    padding: 14px;
    border-radius: var(--radius);
    border: 1px solid var(--glass-border);
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-primary);
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-smooth);

    &:hover {
      border-color: rgba(120, 80, 255, 0.3);
      background: rgba(120, 80, 255, 0.08);
    }

    &--primary {
      background: linear-gradient(135deg, var(--violet), var(--violet-dim));
      border: none;
      color: white;

      &:hover {
        box-shadow: 0 0 25px rgba(120, 80, 255, 0.3);
      }
    }
  }
}
</style>
