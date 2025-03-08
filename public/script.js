// Shared Functions
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&")
        .replace(/</g, "<")
        .replace(/>/g, ">")
        .replace(/"/g, "`")
        .replace(/'/g, "'");
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
}

// Public Page
async function loadPublicPage() {
    if (!document.getElementById('folder-list')) return;

    document.getElementById('dark-mode-toggle').addEventListener('click', toggleDarkMode);

    const response = await fetch('/api/languages');
    const languages = await response.json();
    const folderList = document.getElementById('folder-list');

    languages.forEach(language => {
        const folderDiv = document.createElement('div');
        folderDiv.className = 'folder';
        folderDiv.textContent = language.charAt(0).toUpperCase() + language.slice(1);
        folderDiv.onclick = () => toggleFolder(language);

        const contentDiv = document.createElement('div');
        contentDiv.id = `${language}-content`;
        contentDiv.className = 'folder-content';

        folderList.appendChild(folderDiv);
        folderList.appendChild(contentDiv);
    });
}

async function toggleFolder(language) {
    const contentDiv = document.getElementById(`${language}-content`);
    const isOpen = contentDiv.style.display === 'block';
    contentDiv.style.display = isOpen ? 'none' : 'block';
    if (!isOpen) {
        const response = await fetch(`/api/codes/${language}`);
        const codes = await response.json();
        contentDiv.innerHTML = '';

        codes.forEach(code => {
            const div = document.createElement('div');
            div.className = 'code-container';
            div.innerHTML = `
                <h4>${escapeHtml(code.title)}</h4>
                <pre><code class="language-${language}">${escapeHtml(code.content)}</code></pre>
                <small>Added: ${new Date(code.createdAt).toLocaleString()}</small>
            `;
            contentDiv.appendChild(div);
        });

        setTimeout(() => Prism.highlightAll(), 0);
    }
}

async function addCode() {
    const language = document.getElementById('folder-name')?.value.toLowerCase() || 
                     document.getElementById('new-language')?.value.toLowerCase();
    const title = document.getElementById('code-title')?.value.trim();
    const content = document.getElementById('code-input').value;

    if (!language || !title || !content) {
        alert('Please fill in all fields: folder name, code title, and code content');
        return;
    }

    await fetch('/api/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, title, content })
    });

    document.getElementById('code-input').value = '';
    if (document.getElementById('folder-name')) document.getElementById('folder-name').value = '';
    if (document.getElementById('new-language')) document.getElementById('new-language').value = '';
    if (document.getElementById('code-title')) document.getElementById('code-title').value = '';

    if (document.getElementById('folder-list')) loadPublicPage();
    if (document.getElementById('language-select')) {
        loadLanguages();
        const select = document.getElementById('language-select');
        if (select.value === language) loadAdminCodes(language);
    }
}

// Admin Page
function loadAdminPage() {
    if (!document.getElementById('admin-panel')) return;

    document.getElementById('dark-mode-toggle').addEventListener('click', toggleDarkMode);

    const authSection = document.getElementById('admin-auth');
    const panelSection = document.getElementById('admin-panel');
    
    // If not logged in, show auth section
    if (!localStorage.getItem('adminLoggedIn')) {
        authSection.style.display = 'block';
    } else {
        panelSection.style.display = 'block';
        loadLanguages();
    }
}

function loginAdmin() {
    const password = document.getElementById('admin-password').value;
    fetch('/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    }).then(response => response.json())
      .then(result => {
          if (result.success) {
              localStorage.setItem('adminLoggedIn', 'true');
              document.getElementById('admin-auth').style.display = 'none';
              document.getElementById('admin-panel').style.display = 'block';
              loadLanguages();
          } else {
              alert(result.message || 'Incorrect password');
          }
      });
}

async function loadLanguages() {
    const response = await fetch('/api/languages');
    const languages = await response.json();
    const select = document.getElementById('language-select');
    select.innerHTML = '<option value="">Select Folder</option>';
    languages.forEach(language => {
        const option = document.createElement('option');
        option.value = language;
        option.textContent = language.charAt(0).toUpperCase() + language.slice(1);
        select.appendChild(option);
    });
}

async function loadAdminCodes(language) {
    if (!language) return;
    const response = await fetch(`/api/codes/${language}`);
    const codes = await response.json();
    const codeList = document.getElementById('code-list');
    codeList.innerHTML = '';

    codes.forEach(code => {
        const div = document.createElement('div');
        div.className = 'code-container';
        div.innerHTML = `
            <h4>${escapeHtml(code.title)}</h4>
            <pre><code class="language-${language}">${escapeHtml(code.content)}</code></pre>
            <small>Added: ${new Date(code.createdAt).toLocaleString()}</small>
            <button class="delete-btn" onclick="deleteCode('${code._id}', '${language}')">Delete</button>
        `;
        codeList.appendChild(div);
    });

    setTimeout(() => Prism.highlightAll(), 0);
}

async function deleteCode(id, language) {
    await fetch(`/api/codes/${id}`, { method: 'DELETE' });
    loadAdminCodes(language);
}