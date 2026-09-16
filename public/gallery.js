const categories = [
  {
    title: 'Remodeling',
    images: Array.from({length: 27}, (_, i) => `Hunt-Home-Improvements-Remodeling-Gallery-${i+1}.webp`)
  },
  {
    title: 'Decks, Porches & Pergolas',
    images: Array.from({length: 20}, (_, i) => `HUnt-Home-Improvement-DECKS-PORCHES-PERGOLAS-${i+1}.webp`)
  },
  {
    title: 'Painting',
    images: [
      ...Array.from({length: 13}, (_, i) => `Hunt-Home-Improvement-Residential-Painting-Gallery-${i+1}.webp`),
      ...Array.from({length: 9}, (_, i) => `Hunt-Home-Improvement-Commercial-Painting-Gallery-${i+1}.webp`)
    ]
  },
  {
    title: 'Flooring',
    images: Array.from({length: 10}, (_, i) => `Hunt-Home-Improvement-Flooring-Gallery-${i+1}.webp`)
  },
  {
    title: 'Installation',
    images: Array.from({length: 11}, (_, i) => `Hunt-Home-Improvement-Installation-Gallery-${i+1}.webp`)
  },
  {
    title: 'Roofing & Awnings',
    images: Array.from({length: 7}, (_, i) => `Hunt-Home-Improvement-ROOFING-AND-AWNINGS-Gallery-${i+1}.webp`)
  },
  {
    title: 'General Repairs',
    images: Array.from({length: 12}, (_, i) => `Hunt-Home-Improvement-General-Repairs-${i+1}.webp`)
  }
];

const container = document.getElementById('gallery-container');

function createCTABand() {
  const cta = document.createElement('div');
  cta.className = 'cta-band';
  cta.innerHTML = `
    <h3>Ready to start your project?</h3>
    <p>Let's make your home work better for you. Reach out today for a free estimate.</p>
    <div class="cta-actions">
      <a class="button button-light" href="tel:8594756976">Call 859-475-6976</a>
      <a class="button" href="/#contact">Request an estimate</a>
    </div>
  `;
  return cta;
}

categories.forEach((category, index) => {
  const section = document.createElement('div');
  section.className = 'gallery-category';
  
  const heading = document.createElement('h3');
  heading.textContent = category.title;
  section.appendChild(heading);
  
  const galleryGrid = document.createElement('div');
  galleryGrid.className = 'gallery'; // Reusing the same grid style from index.html
  
  category.images.forEach(imageName => {
    const figure = document.createElement('figure');
    figure.className = 'tile';
    const image = document.createElement('img');
    image.src = `/assets/images/${encodeURIComponent(imageName)}`;
    image.alt = `Hunt Home Improvements completed ${category.title.toLowerCase()} project`;
    image.loading = 'lazy';
    figure.append(image);
    galleryGrid.append(figure);
  });
  
  section.appendChild(galleryGrid);
  container.appendChild(section);

  // Insert a CTA band after every 2 categories, but not after the last one
  if ((index + 1) % 2 === 0 && index !== categories.length - 1) {
    container.appendChild(createCTABand());
  }
});

// Lightbox functionality
const lightbox = document.createElement('div');
lightbox.className = 'lightbox';
lightbox.innerHTML = `
  <button class="lightbox-close" aria-label="Close lightbox">&times;</button>
  <img src="" alt="Enlarged project view">
`;
document.body.appendChild(lightbox);

const lightboxImg = lightbox.querySelector('img');
const closeBtn = lightbox.querySelector('.lightbox-close');

function openLightbox(src) {
  lightboxImg.src = src;
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden'; // Prevent scrolling
}

function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
  // Clear src after transition ends to avoid flicker
  setTimeout(() => { lightboxImg.src = ''; }, 300);
}

closeBtn.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

// Add click listeners to all gallery images
container.addEventListener('click', (e) => {
  const tile = e.target.closest('figure.tile');
  if (tile) {
    const img = tile.querySelector('img');
    if (img) openLightbox(img.src);
  }
});
