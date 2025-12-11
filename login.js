
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO SUPABASE ---
const SB_URL = 'https://rxvinjguehzfaqmmpvxu.supabase.co';
const SB_KEY = 'sb_publishable_B_pNNMFJR044JCaY5YIh6A_vPtDHf1M';
const supabase = createClient(SB_URL, SB_KEY);

// DOM Elements - Views
const viewLogin = document.getElementById('view-login');
const viewRegister = document.getElementById('view-register');

// DOM Elements - Forms & Inputs
const formLogin = document.getElementById('form-login');
const loginEmail = document.getElementById('login-email');
const loginPass = document.getElementById('login-password');
const loginMsg = document.getElementById('msg-login');
const btnLoginSubmit = document.getElementById('btn-submit-login');
const btnGithub = document.getElementById('btn-github'); // GitHub Button
const btnGuest = document.getElementById('btn-guest'); // Guest Button

const formRegister = document.getElementById('form-register');
const regEmail = document.getElementById('reg-email');
const regPass = document.getElementById('reg-password');
const regMsg = document.getElementById('msg-register');
const btnRegSubmit = document.getElementById('btn-submit-register');

// DOM Elements - Navigation
const goToRegister = document.getElementById('go-to-register');
const goToLogin = document.getElementById('go-to-login');

// --- SESSION CHECK ---
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        window.location.href = 'index.html';
    }
}
checkSession();

// --- NAVIGATION LOGIC ---
goToRegister.addEventListener('click', () => {
    viewLogin.classList.add('hidden');
    viewRegister.classList.remove('hidden');
    clearMessages();
});

goToLogin.addEventListener('click', () => {
    viewRegister.classList.add('hidden');
    viewLogin.classList.remove('hidden');
    clearMessages();
});

function clearMessages() {
    loginMsg.classList.add('hidden');
    regMsg.classList.add('hidden');
    loginMsg.innerText = '';
    regMsg.innerText = '';
}

function showFeedback(element, msg, isError = true) {
    element.innerText = msg;
    element.classList.remove('hidden');
    if (isError) {
        element.classList.remove('bg-green-900/80', 'border-green-500');
        element.classList.add('bg-red-900/80', 'border-red-500');
    } else {
        element.classList.remove('bg-red-900/80', 'border-red-500');
        element.classList.add('bg-green-900/80', 'border-green-500');
    }
}

// --- HANDLERS ---

// GUEST LOGIN (No Auth)
if (btnGuest) {
    btnGuest.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
}

// GITHUB LOGIN
if (btnGithub) {
    btnGithub.addEventListener('click', async () => {
        btnGithub.disabled = true;
        btnGithub.innerHTML = "REDIRECTING... <span class='blink'>_</span>";
        
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                // Redireciona de volta para a app principal após login
                redirectTo: window.location.href.replace('login.html', 'index.html')
            }
        });

        if (error) {
            showFeedback(loginMsg, `GITHUB ERROR: ${error.message}`);
            btnGithub.disabled = false;
            btnGithub.innerHTML = "<span>👾</span> ACCESS VIA GITHUB";
        }
    });
}

// EMAIL LOGIN
formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    btnLoginSubmit.disabled = true;
    btnLoginSubmit.innerText = "TUNING IN...";
    
    const email = loginEmail.value;
    const password = loginPass.value;

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        showFeedback(loginMsg, `ERROR: ${error.message}`);
        btnLoginSubmit.disabled = false;
        btnLoginSubmit.innerText = "CONNECT SERVICE";
    } else {
        showFeedback(loginMsg, "SIGNAL LOCKED. REDIRECTING...", false);
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
});

// REGISTER
formRegister.addEventListener('submit', async (e) => {
    e.preventDefault();
    btnRegSubmit.disabled = true;
    btnRegSubmit.innerText = "ACTIVATING...";

    const email = regEmail.value;
    const password = regPass.value;

    const { error } = await supabase.auth.signUp({
        email,
        password
    });

    if (error) {
        showFeedback(regMsg, `FAILED: ${error.message}`);
        btnRegSubmit.disabled = false;
        btnRegSubmit.innerText = "ACTIVATE ACCOUNT";
    } else {
        showFeedback(regMsg, "SUCCESS! CHECK EMAIL OR LOGIN.", false);
        setTimeout(() => {
            goToLogin.click();
            showFeedback(loginMsg, "ACCOUNT CREATED. PLEASE LOGIN.", false);
        }, 1500);
    }
});
