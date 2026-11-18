
(() => {
  const page = location.pathname.split('/').pop();

  const go = (target) => {
    location.href = target;
  };

  const byId = (id, target) => {
    const element = document.getElementById(id);
    if (!element) return;
    element.onclick = null;
    element.addEventListener('click', (event) => {
      event.preventDefault();
      go(target);
    });
  };

  const byText = (selector, phrase, target, occurrence = 0) => {
    const matches = [...document.querySelectorAll(selector)].filter((element) =>
      element.textContent.replace(/\s+/g, ' ').trim().toLowerCase().includes(phrase.toLowerCase())
    );
    const element = matches[occurrence];
    if (!element) return;
    element.onclick = null;
    element.addEventListener('click', (event) => {
      event.preventDefault();
      go(target);
    });
  };

  const backTo = (target) => {
    const button = document.querySelector('button[aria-label="Go back"], button[aria-label="Go Back"]');
    if (!button) return;
    button.onclick = null;
    button.addEventListener('click', (event) => {
      event.preventDefault();
      go(target);
    });
  };

  if (page === 'onboarding.html') {
    byId('getStartedBtn', 'sign-in.html');
    byId('previewBtn', 'home.html');
  }

  if (page === 'sign-in.html') {
    byId('sso-button', 'consent.html');
    byId('guest-preview-btn', 'home.html');
  }

  if (page === 'consent.html') {
    byId('submit-consent-btn', 'home.html');
  }

  if (page === 'home.html') {
    byText('button', 'continue challenge', 'collect.html');
    byText('button', 'see all', 'community.html');
    byText('button', 'comment', 'discovery.html');
  }

  if (page === 'collect.html') {
    backTo('home.html');
    byText('button', 'review contribution', 'review.html');
  }

  if (page === 'review.html') {
    backTo('collect.html');
    byText('button', 'view on global map', 'explore.html');
    byText('button', 'compare with classmates', 'compare.html');
  }

  if (page === 'explore.html') {
    byText('button', 'compare with my result', 'compare.html');
    byText('button', 'compare locations', 'compare.html');
    byText('button', 'ask a question', 'community.html');
    byText('a', 'view dataset details', 'dataset.html');
  }

  if (page === 'compare.html') {
    backTo('explore.html');
    byText('button', 'share with my group', 'chat.html');
    byText('button', 'ask the community', 'community.html');
  }

  if (page === 'dataset.html') {
    backTo('explore.html');
    byText('button', 'explore this dataset', 'explore.html');
  }

  if (page === 'community.html') {
    byText('h3', 'asia-pacific network pod', 'chat.html');
    const groupHeading = [...document.querySelectorAll('h3')].find((element) =>
      element.textContent.toLowerCase().includes('asia-pacific network pod')
    );
    if (groupHeading) {
      const card = groupHeading.closest('article, section, div[class*="rounded"]') || groupHeading.parentElement;
      card.style.cursor = 'pointer';
      card.setAttribute('role', 'link');
      card.setAttribute('tabindex', '0');
      card.addEventListener('click', () => go('chat.html'));
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') go('chat.html');
      });
    }
  }

  if (page === 'chat.html') backTo('community.html');
  if (page === 'discovery.html') backTo('home.html');

  if (page === 'profile.html') {
    byText('button', 'sign out', 'sign-in.html');
  }
})();
