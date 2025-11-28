let currentFilter = 'all';

function el(tag, cls, txt){ const e = document.createElement(tag); if(cls) e.className = cls; if(txt!==undefined) e.textContent = txt; return e; }

async function readList(){
  try {
    const response = await fetch('/api/watchlist');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch(e) {
    console.error('Error loading watchlist:', e);
    return [];
  }
}

async function writeList(list){
  try {
    const response = await fetch('/api/watchlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(list)
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result;
  } catch(e) {
    console.error('Error saving watchlist:', e);
    alert('Failed to save anime. Please try again.');
    throw e;
  }
}

function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

function getStatusColor(status){
  const colors = { 'plan-to-watch': '#38506A', 'watching': '#446983', 'completed': '#071018', 'dropped': '#38506A' };
  return colors[status] || '#38506A';
}

function getStatusLabel(status){
  const labels = { 'plan-to-watch': 'Plan to watch', 'watching': 'Watching', 'completed': 'Completed', 'dropped': 'Dropped' };
  return labels[status] || status;
}

function renderItem(item){
  const card = el('div','card');
  
  if (item.image) {
    const imgWrapper = el('div', 'img-wrapper');
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.title;
    imgWrapper.appendChild(img);
    card.appendChild(imgWrapper);
  } else {
    const placeholder = el('div', 'img-placeholder', '📺');
    card.appendChild(placeholder);
  }
  
  const body = el('div', 'card-body');
  
  const headerRow = el('div', 'card-header');
  const title = el('h3', null, item.title);
  headerRow.appendChild(title);
  body.appendChild(headerRow);
  
  if (item.genres && item.genres.length) {
    const genreRow = el('div', 'genre-row');
    item.genres.forEach(g => {
      const badge = el('span', 'genre-badge', g);
      genreRow.appendChild(badge);
    });
    body.appendChild(genreRow);
  }
  
  const statusBadgeRow = el('div', 'status-badge-row');
  const badge = el('span', 'status-badge', getStatusLabel(item.status));
  badge.style.backgroundColor = getStatusColor(item.status);
  statusBadgeRow.appendChild(badge);
  body.appendChild(statusBadgeRow);
  
  const episodeLinks = el('div', 'episode-links');
  const editBtn = el('button', null, 'Edit');
  editBtn.addEventListener('click', (e) => {
    e.preventDefault();
    editItem(item);
  });
  episodeLinks.appendChild(editBtn);
  body.appendChild(episodeLinks);
  
  const epDisplay = el('div', 'ep-display');
  const epValue = el('span', 'ep-value', `Ep ${item.currentEpisode || 0} / ${item.episodes || '?'}`);
  const epPercentage = el('span', 'ep-percentage', item.episodes ? `${Math.round((item.currentEpisode || 0) / item.episodes * 100)}% completed` : 'Not started');
  epDisplay.appendChild(epValue);
  epDisplay.appendChild(epPercentage);
  body.appendChild(epDisplay);
  
  const progressContainer = el('div', 'progress-bar-container');
  const progressBar = el('div', 'progress-bar');
  const percentage = item.episodes ? (item.currentEpisode || 0) / item.episodes * 100 : 0;
  progressBar.style.width = `${Math.min(percentage, 100)}%`;
  progressContainer.appendChild(progressBar);
  body.appendChild(progressContainer);
  
  const epSection = el('div', 'ep-section');
  const epRow = el('div', 'ep-row');
  const epLabel = el('span', 'ep-label', `Current episode`);
  const epControls = el('div', 'ep-controls');
  
  const decBtn = el('button', 'ep-btn', '−');
  decBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      const list = await readList();
      const idx = list.findIndex(i => i.id === item.id);
      if (idx !== -1 && (list[idx].currentEpisode || 0) > 0) {
        list[idx].currentEpisode = (list[idx].currentEpisode || 0) - 1;
        await writeList(list);
        await load();
      }
    } catch (error) {
      console.error('Error updating episode:', error);
    }
  });
  
  const epVal = el('span', 'ep-val', item.currentEpisode || '0');
  
  const incBtn = el('button', 'ep-btn', '+');
  incBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      const list = await readList();
      const idx = list.findIndex(i => i.id === item.id);
      if (idx !== -1) {
        list[idx].currentEpisode = (list[idx].currentEpisode || 0) + 1;
        if (list[idx].episodes && list[idx].episodes > 0 && list[idx].currentEpisode > list[idx].episodes) {
          list[idx].currentEpisode = list[idx].episodes;
        }
        await writeList(list);
        await load();
      }
    } catch (error) {
      console.error('Error updating episode:', error);
    }
  });
  
  epControls.appendChild(decBtn);
  epControls.appendChild(epVal);
  epControls.appendChild(incBtn);
  epRow.appendChild(epLabel);
  epRow.appendChild(epControls);
  epSection.appendChild(epRow);
  body.appendChild(epSection);
  
  const footer = el('div', 'card-footer');
  
  if (item.status !== 'completed') {
    const completeBtn = el('button', 'mark-completed-btn');
    const pencilIcon = el('span', 'pencil-icon', '✎');
    completeBtn.appendChild(document.createTextNode('Mark as Completed'));
    completeBtn.appendChild(pencilIcon);
    completeBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        const list = await readList();
        const idx = list.findIndex(i => i.id === item.id);
        if (idx !== -1) {
          list[idx].status = 'completed';
          list[idx].currentEpisode = list[idx].episodes || 0;
          await writeList(list);
          await load();
        }
      } catch (error) {
        console.error('Error marking as completed:', error);
      }
    });
    footer.appendChild(completeBtn);
  }
  
  const delBtn = el('button', 'action-btn delete', '🗑');
  delBtn.title = 'Delete';
  delBtn.addEventListener('click', async () => {
    if (!confirm('Delete this entry?')) return;
    try {
      const list = (await readList()).filter(i => i.id !== item.id);
      await writeList(list);
      await load();
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  });
  footer.appendChild(delBtn);
  
  body.appendChild(footer);
  card.appendChild(body);
  return card;
}

async function load(){
  const listEl = document.getElementById('list');
  listEl.innerHTML = '';
  const items = await readList();
  
  let filtered = items;
  if (currentFilter === 'watching') filtered = items.filter(i => i.status === 'watching');
  else if (currentFilter === 'completed') filtered = items.filter(i => i.status === 'completed');
  
  if (!filtered.length) listEl.appendChild(el('div', 'empty', 'No items yet'));
  filtered.slice().reverse().forEach(it => listEl.appendChild(renderItem(it)));
}

function readFileAsDataURL(file){
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

// Image preview handling - define early so it's available everywhere
const imageFile = document.getElementById('imageFile');
const imagePreview = document.getElementById('imagePreview');

function resetImagePreview() {
  if (imagePreview) {
    imagePreview.innerHTML = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg><p>Click to add image</p>`;
  }
  if (imageFile) imageFile.value = '';
}

if (imagePreview && imageFile) {
  imagePreview.addEventListener('click', () => {
    imageFile.click();
  });

  imageFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        imagePreview.innerHTML = `<img src="${event.target.result}" alt="preview" />`;
      };
      reader.readAsDataURL(file);
    }
  });
}

const addForm = document.getElementById('addForm');
const submitBtn = addForm ? addForm.querySelector('button[type="submit"]') : null;

if (addForm) {
  addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const title = document.getElementById('title').value.trim();
      if (!title) {
        alert('Title required');
        return;
      }
      
      const episodes = Number(document.getElementById('episodes').value) || 0;
      let currentEpisode = Number(document.getElementById('currentEpisode').value) || 0;
      if (episodes > 0) {
        if (currentEpisode < 0) currentEpisode = 0;
        if (currentEpisode > episodes) currentEpisode = episodes;
      } else {
        if (currentEpisode < 0) currentEpisode = 0;
      }
      const status = document.getElementById('status').value;
      const genresStr = document.getElementById('genres') ? document.getElementById('genres').value.trim() : '';
      const imageFileInput = document.getElementById('imageFile').files[0];

      let image = null;
      if (imageFileInput) {
        try { 
          image = await readFileAsDataURL(imageFileInput); 
        } catch(e) { 
          console.warn('image read failed', e); 
        }
      }

      const list = await readList();

      // If form has data-edit-id, update existing item instead of creating new
      const editId = addForm.dataset.editId;
      if (editId) {
        const idx = list.findIndex(i => i.id === editId);
        if (idx !== -1) {
          list[idx] = Object.assign({}, list[idx], {
            title,
            episodes,
            currentEpisode,
            status,
            image: image || list[idx].image,
            genres: genresStr ? genresStr.split(',').map(g => g.trim()) : (list[idx].genres || [])
          });
          await writeList(list);
          delete addForm.dataset.editId;
          addForm.reset();
          resetImagePreview();
          if (submitBtn) submitBtn.textContent = 'Add to List';
          modal.classList.add('modal-hidden');
          await load();
          return;
        }
      }

      const item = { id: uid(), title, episodes, currentEpisode, status, genres: [], image };
      item.genres = genresStr ? genresStr.split(',').map(g => g.trim()) : [];
      list.push(item);
      await writeList(list);
      addForm.reset();
      resetImagePreview();
      if (submitBtn) submitBtn.textContent = 'Add to List';
      modal.classList.add('modal-hidden');
      await load();
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Failed to save anime. Please check the console for details.');
    }
  });
}

const modal = document.getElementById('formModal');
const closeBtn = document.querySelector('.close');

function closeModal() {
  if (!modal || !addForm) return;
  modal.classList.add('modal-hidden');
  addForm.reset();
  delete addForm.dataset.editId;
  resetImagePreview();
  if (submitBtn) submitBtn.textContent = 'Add to List';
  const titleEl = modal.querySelector('h2');
  if (titleEl) titleEl.textContent = 'Add anime';
}

if (document.getElementById('addBtn')) {
document.getElementById('addBtn').addEventListener('click', () => {
  // ensure add form is in create mode
  delete addForm.dataset.editId;
  addForm.reset();
    resetImagePreview();
  if (submitBtn) submitBtn.textContent = 'Add to List';
  const titleEl = modal.querySelector('h2');
  if (titleEl) titleEl.textContent = 'Add anime';
  modal.classList.remove('modal-hidden');
});
}

if (closeBtn) {
closeBtn.addEventListener('click', () => {
    closeModal();
  });
}

window.addEventListener('click', (e) => { 
  if (e.target === modal) { 
    closeModal();
  } 
});

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    load();
  });
});

async function editItem(item) {
  const list = await readList();
  const idx = list.findIndex(i => i.id === item.id);
  if (idx === -1) return;
  
  const formModal = document.getElementById('formModal');
  document.getElementById('title').value = item.title;
  document.getElementById('episodes').value = item.episodes || 0;
  document.getElementById('currentEpisode').value = item.currentEpisode || 0;
  document.getElementById('genres').value = item.genres ? item.genres.join(', ') : '';
  document.getElementById('status').value = item.status;
  document.getElementById('imageFile').value = '';
  // show existing image in preview if present
  if (item.image) {
    if (imagePreview) imagePreview.innerHTML = `<img src="${item.image}" alt="preview" />`;
  } else {
    resetImagePreview();
  }
  // mark the form as editing this item id; the submit handler will update the item
  const form = document.getElementById('addForm');
  form.dataset.editId = item.id;
  if (submitBtn) submitBtn.textContent = 'Save Changes';
  const titleEl = formModal.querySelector('h2');
  if (titleEl) titleEl.textContent = 'Edit anime';
  formModal.classList.remove('modal-hidden');
}

load();

