/**************************************
    Huella Verde SAS - Formulario de Contacto
    Envío vía FormSubmit (https://formsubmit.co)
    - Servicio gratuito, sin registro ni API key
    - Entrega los mensajes a: huellaverde@live.com
    - Envío AJAX sin recargar la página
    - Estados: cargando / éxito / error con reintento

    IMPORTANTE (solo la primera vez):
    El primer envío dispara un correo de activación
    de FormSubmit a huellaverde@live.com. Hay que
    abrir ese correo y pulsar "Activate" una única vez.
    Desde ese momento todos los mensajes llegan
    directamente a la bandeja de entrada.
**************************************/

(function () {
    'use strict';

    var DESTINO = 'huellaverde@live.com';
    var AJAX_ENDPOINT = 'https://formsubmit.co/ajax/' + DESTINO;

    /* Límite de envíos (anti-abuso, criterio razonable):
       - mínimo 60 segundos entre mensajes
       - máximo 4 mensajes por hora
       Un visitante normal nunca lo nota; un bot o un
       malintencionado no puede saturar la bandeja. */
    var RATE = {
        KEY: 'hv_form_sends',
        MIN_GAP_MS: 60 * 1000,
        MAX_PER_HOUR: 4
    };

    function getSends() {
        try {
            var raw = localStorage.getItem(RATE.KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function recordSend() {
        try {
            var sends = getSends();
            sends.push(Date.now());
            localStorage.setItem(RATE.KEY, JSON.stringify(sends.slice(-10)));
        } catch (e) { /* almacenamiento no disponible: continuar */ }
    }

    function checkRateLimit() {
        var now = Date.now();
        var lastHour = getSends().filter(function (t) {
            return now - t < 60 * 60 * 1000;
        });
        if (lastHour.length) {
            var sinceLast = now - lastHour[lastHour.length - 1];
            if (sinceLast < RATE.MIN_GAP_MS) {
                return {
                    ok: false,
                    message: 'Tu mensaje anterior se envió hace un momento. Espera ' +
                        Math.ceil((RATE.MIN_GAP_MS - sinceLast) / 1000) +
                        ' segundos antes de enviar otro.'
                };
            }
        }
        if (lastHour.length >= RATE.MAX_PER_HOUR) {
            return {
                ok: false,
                message: 'Alcanzaste el máximo de mensajes por hora desde este dispositivo.'
            };
        }
        return { ok: true };
    }

    var form = document.getElementById('contactForm');
    if (!form) return;

    // Navegadores sin fetch: se deja el envío nativo del <form>
    // (action apunta a formsubmit.co y muestra su página de gracias)
    if (!window.fetch) return;

    var submitBtn = form.querySelector('.hv-btn-submit');
    var successBox = document.getElementById('formSuccessMessage');
    var errorBox = null;

    function showError(mensaje) {
        if (!errorBox) {
            errorBox = document.createElement('div');
            errorBox.className = 'hv-form-message hv-form-message-error';
            errorBox.setAttribute('role', 'alert');
            form.appendChild(errorBox);
        }
        errorBox.innerHTML =
            '<i class="fa fa-exclamation-circle"></i>' +
            '<span>' + mensaje +
            ' También puedes escribirnos directamente a ' +
            '<a href="mailto:' + DESTINO + '">' + DESTINO + '</a>.</span>';
        errorBox.style.display = 'flex';
    }

    function hideError() {
        if (errorBox) errorBox.style.display = 'none';
    }

    function setLoading(loading) {
        if (!submitBtn) return;
        submitBtn.disabled = loading;
        submitBtn.style.opacity = loading ? '0.7' : '';
        submitBtn.innerHTML = loading
            ? 'Enviando... <i class="fa fa-circle-o-notch fa-spin"></i>'
            : 'Enviar <i class="fa fa-paper-plane"></i>';
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Honeypot anti-spam: si el campo oculto trae texto, es un bot
        var honey = form.querySelector('input[name="_honey"]');
        if (honey && honey.value) return;

        // Límite de envíos
        var limit = checkRateLimit();
        if (!limit.ok) {
            showError(limit.message);
            return;
        }

        hideError();
        setLoading(true);

        var payload = {
            email: (form.querySelector('#email') || {}).value || '',
            nombre: (form.querySelector('#nombre') || {}).value || '',
            apellido: (form.querySelector('#apellido') || {}).value || '',
            mensaje: (form.querySelector('#mensaje') || {}).value || '',
            _subject: 'Nuevo mensaje desde Huella Verde Web',
            _template: 'table',
            _captcha: 'false'
        };

        fetch(AJAX_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        })
            .then(function (res) {
                if (!res.ok) {
                    throw new Error('HTTP ' + res.status);
                }
                return res.json();
            })
            .then(function () {
                recordSend();
                form.reset();
                form.style.display = 'none';
                if (successBox) {
                    successBox.style.display = 'block';
                    successBox.setAttribute('tabindex', '-1');
                    successBox.focus({ preventScroll: false });
                    successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            })
            .catch(function () {
                showError('No pudimos enviar tu mensaje en este momento. Inténtalo de nuevo en unos minutos.');
            })
            .then(function () {
                setLoading(false);
            });
    });
})();
