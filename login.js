import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// --- CONFIGURAÇÃO SUPABASE ---
const SB_URL = 'https://rxvinjguehzfaqmmpvxu.supabase.co';
const SB_KEY = 'sb_publishable_B_pNNMFJR044JCaY5YIh6A_vPtDHf1M';
const supabase = createClient(SB_URL, SB_KEY);

// DOM Elements
const form = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const btnLogin = document.getElementById('btn-login');
const btnRegister = document.getElementById('btn-register');
const msgBox = document.getElementById('auth-msg');

// Check if already logged in
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        window.location.href = 'index.html';
    }
}
checkSession();

// Utils
function showMessage(msg, isError = true) {
    msgBox.textContent = `> ${msg}`;
    msgBox.classList.remove('hidden');
    if (isError) {
        msgBox.classList.add('text-red-500', 'border-red-500', 'bg-red-900/20');
        msgBox.classList.remove('text-yellow-400', 'border-yellow-400', 'bg-yellow-900/20');
    } else {
        msgBox.classList.remove('text-red-500', 'border-red-500', 'bg-red-900/20');
        msgBox.classList.add('text-yellow-400', 'border-yellow-400', 'bg-yellow-900/20');
    }
}

function setLoading(isLoading) {
    if (isLoading) {
        btnLogin.textContent = "[ PROCESSING... ]";
        btnLogin.disabled = true;
        btnRegister.disabled = true;
    } else {
        btnLogin.textContent = "[ LOGIN ]";
        btnLogin.disabled = false;
        btnRegister.disabled = false;
    }
}

// Handlers
async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    msgBox.classList.add('hidden');

    const email = emailInput.value;
    const password = passwordInput.value;

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        showMessage(`ACCESS DENIED: ${error.message}`);
        setLoading(false);
    } else {
        showMessage("ACCESS GRANTED. REDIRECTING...", false);
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

async function handleRegister() {
    setLoading(true);
    msgBox.classList.add('hidden');

    const email = emailInput.value;
    const password = passwordInput.value;

    if (!email || !password) {
        showMessage("INPUT DATA REQUIRED");
        setLoading(false);
        return;
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });

    if (error) {
        showMessage(`REGISTRATION FAILED: ${error.message}`);
    } else {
        showMessage("USER CREATED. PLEASE LOGIN.", false);
    }
    setLoading(false);
}

// Events
form.addEventListener('submit', handleLogin);
btnRegister.addEventListener('click', handleRegister);