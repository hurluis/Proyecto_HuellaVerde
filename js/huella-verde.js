/**************************************
    Huella Verde SAS - Main JavaScript
    Funcionalidades:
    - AOS (Animate on Scroll) init
    - Sticky header con efecto scroll
    - Navegación activa por sección
    - Menú hamburguesa móvil
    - Expandir/colapsar servicios
    - Smooth scroll
    - Botón scroll to top
    - Botón WhatsApp flotante
    - Formulario de contacto
**************************************/

(function() {
    'use strict';

    /* ===================================
       INICIALIZACIÓN AOS
    =================================== */
    document.addEventListener('DOMContentLoaded', function() {
        // Inicializar AOS - Animate on Scroll
        AOS.init({
            duration: 800,
            easing: 'ease-out-cubic',
            once: true,           // Animación solo una vez
            offset: 80,           // Offset desde el viewport
            delay: 0,
            anchorPlacement: 'top-bottom'
        });
    });

    /* ===================================
       HEADER STICKY CON EFECTO SCROLL
    =================================== */
    var header = document.getElementById('hv-header');
    var lastScrollY = 0;

    window.addEventListener('scroll', function() {
        var currentScrollY = window.scrollY;

        if (currentScrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        lastScrollY = currentScrollY;
    });

    /* ===================================
       NAVEGACIÓN ACTIVA POR SECCIÓN
       (IntersectionObserver)
    =================================== */
    var sections = document.querySelectorAll('.hv-section[id]');
    var navLinks = document.querySelectorAll('.hv-nav-link');

    // Observar cada sección para actualizar el menú activo
    var sectionObserverOptions = {
        root: null,
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0
    };

    var sectionObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                var sectionId = entry.target.getAttribute('id');

                // Remover clase active de todos los links
                navLinks.forEach(function(link) {
                    link.classList.remove('active');
                });

                // Agregar active al link correspondiente
                var activeLink = document.querySelector('.hv-nav-link[href="#' + sectionId + '"]');
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        });
    }, sectionObserverOptions);

    sections.forEach(function(section) {
        sectionObserver.observe(section);
    });

    /* ===================================
       MENÚ HAMBURGUESA (MÓVIL)
    =================================== */
    var menuToggle = document.getElementById('menuToggle');
    var hvNav = document.getElementById('hvNav');

    if (menuToggle && hvNav) {
        menuToggle.addEventListener('click', function() {
            menuToggle.classList.toggle('active');
            hvNav.classList.toggle('open');
            document.body.style.overflow = hvNav.classList.contains('open') ? 'hidden' : '';
        });

        // Cerrar menú al hacer clic en un enlace
        var mobileLinks = hvNav.querySelectorAll('.hv-nav-link');
        mobileLinks.forEach(function(link) {
            link.addEventListener('click', function() {
                menuToggle.classList.remove('active');
                hvNav.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    }

    /* ===================================
       SMOOTH SCROLL PARA LINKS DE ANCLA
    =================================== */
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            var targetId = this.getAttribute('href');
            if (targetId === '#') return;

            var targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                var headerHeight = header ? header.offsetHeight : 0;
                var targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    /* ===================================
       EXPANDIR/COLAPSAR SERVICIOS
    =================================== */
    // Función global para toggle de servicios
    window.toggleServicio = function(btn) {
        var card = btn.closest('.hv-servicio-card');
        var detail = card.querySelector('.hv-servicio-detail');
        var isExpanded = card.classList.contains('expanded');

        // Cerrar todas las tarjetas expandidas primero
        document.querySelectorAll('.hv-servicio-card.expanded').forEach(function(openCard) {
            if (openCard !== card) {
                openCard.classList.remove('expanded');
                var openDetail = openCard.querySelector('.hv-servicio-detail');
                if (openDetail) {
                    openDetail.style.display = 'none';
                }
                // Restaurar el botón "Ver más"
                var openBtn = openCard.querySelector('.hv-servicio-body .hv-btn-outline');
                if (openBtn) {
                    openBtn.innerHTML = 'Ver más <i class="fa fa-plus"></i>';
                }
            }
        });

        if (isExpanded) {
            // Colapsar la tarjeta actual
            card.classList.remove('expanded');
            detail.style.display = 'none';
            var verMasBtn = card.querySelector('.hv-servicio-body .hv-btn-outline');
            if (verMasBtn) {
                verMasBtn.innerHTML = 'Ver más <i class="fa fa-plus"></i>';
            }
        } else {
            // Expandir la tarjeta actual
            card.classList.add('expanded');
            detail.style.display = 'block';
            var verMasBtn = card.querySelector('.hv-servicio-body .hv-btn-outline');
            if (verMasBtn) {
                verMasBtn.innerHTML = 'Ver menos <i class="fa fa-minus"></i>';
            }

            // Scroll suave hacia la tarjeta expandida
            setTimeout(function() {
                var headerHeight = header ? header.offsetHeight : 0;
                var cardTop = card.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
                window.scrollTo({
                    top: cardTop,
                    behavior: 'smooth'
                });

                // Re-iniciar AOS para las nuevas imágenes visibles
                AOS.refresh();
            }, 100);
        }
    };

    /* ===================================
       BOTÓN SCROLL TO TOP
    =================================== */
    var scrollTopBtn = document.getElementById('scrollTop');

    window.addEventListener('scroll', function() {
        if (window.scrollY > 400) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    });

    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    /* ===================================
       BOTÓN WHATSAPP FLOTANTE
    =================================== */
    var whatsappBtn = document.getElementById('whatsappBtn');

    // Mostrar botón de WhatsApp después de un breve delay
    window.addEventListener('scroll', function() {
        if (window.scrollY > 200) {
            whatsappBtn.classList.add('visible');
        } else {
            whatsappBtn.classList.remove('visible');
        }
    });

    // También mostrar después de 2 segundos aunque no haya scroll
    setTimeout(function() {
        if (whatsappBtn) {
            whatsappBtn.classList.add('visible');
        }
    }, 2000);

    /* ===================================
       FORMULARIO DE CONTACTO
       (Validación básica del frontend)

       NOTA: Para enviar correo a huellaverde@live.com
       se necesita un backend. Opciones:
       1. NodeMailer con Express.js
       2. Formspree.io (agregar action del form)
       3. EmailJS (frontend-only)
       4. PHP mail() en hosting con PHP
    =================================== */
    var contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            var email = document.getElementById('email').value.trim();
            var nombre = document.getElementById('nombre').value.trim();
            var mensaje = document.getElementById('mensaje').value.trim();

            // Validación básica
            if (!email) {
                showFormMessage('Por favor ingresa tu correo electrónico.', 'error');
                return;
            }

            if (!isValidEmail(email)) {
                showFormMessage('Por favor ingresa un correo electrónico válido.', 'error');
                return;
            }

            // Simular envío exitoso (reemplazar con lógica real de envío)
            var submitBtn = contactForm.querySelector('.hv-btn-submit');
            var originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Enviando...';
            submitBtn.disabled = true;

            // Simulación de envío
            setTimeout(function() {
                submitBtn.innerHTML = '<i class="fa fa-check"></i> Enviado';
                showFormMessage('¡Mensaje enviado correctamente! Nos pondremos en contacto pronto.', 'success');

                // Resetear formulario después de 3 segundos
                setTimeout(function() {
                    contactForm.reset();
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }, 3000);
            }, 1500);
        });
    }

    function isValidEmail(email) {
        var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function showFormMessage(message, type) {
        // Remover mensaje anterior si existe
        var existing = document.querySelector('.hv-form-message');
        if (existing) existing.remove();

        var msgEl = document.createElement('div');
        msgEl.className = 'hv-form-message hv-form-message-' + type;
        msgEl.innerHTML = '<i class="fa fa-' + (type === 'success' ? 'check-circle' : 'exclamation-circle') + '"></i> ' + message;

        var form = document.getElementById('contactForm');
        form.parentNode.insertBefore(msgEl, form.nextSibling);

        // Auto-remover después de 5 segundos
        setTimeout(function() {
            if (msgEl.parentNode) {
                msgEl.style.opacity = '0';
                setTimeout(function() {
                    if (msgEl.parentNode) msgEl.remove();
                }, 300);
            }
        }, 5000);
    }

    /* ===================================
       ESTILOS DINÁMICOS PARA MENSAJES
       DEL FORMULARIO
    =================================== */
    var formStyles = document.createElement('style');
    formStyles.textContent = '' +
        '.hv-form-message {' +
        '    padding: 14px 20px;' +
        '    border-radius: 8px;' +
        '    margin-top: 16px;' +
        '    font-size: 14px;' +
        '    font-weight: 600;' +
        '    display: flex;' +
        '    align-items: center;' +
        '    gap: 10px;' +
        '    transition: opacity 0.3s ease;' +
        '}' +
        '.hv-form-message-success {' +
        '    background-color: #e8f5e9;' +
        '    color: #2e7d32;' +
        '    border: 1px solid #a5d6a7;' +
        '}' +
        '.hv-form-message-error {' +
        '    background-color: #fce4ec;' +
        '    color: #c62828;' +
        '    border: 1px solid #ef9a9a;' +
        '}';
    document.head.appendChild(formStyles);

})();
