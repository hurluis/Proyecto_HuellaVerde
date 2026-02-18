/**************************************
    Huella Verde SAS - Main JavaScript
    Versión: Multi-página
    Funcionalidades:
    - AOS (Animate on Scroll) init
    - Sticky header con efecto scroll
    - Navegación activa según página actual
    - Menú hamburguesa móvil
    - Expandir/colapsar servicios
    - Auto-expandir servicio desde hash URL
    - Smooth scroll interno
    - Botón scroll to top
    - Botón WhatsApp flotante
    - Formspree: detección de envío exitoso
**************************************/

(function() {
    'use strict';

    /* ===================================
       INICIALIZACIÓN AOS
    =================================== */
    document.addEventListener('DOMContentLoaded', function() {
        // Inicializar AOS - Animate on Scroll
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 800,
                easing: 'ease-out-cubic',
                once: true,
                offset: 80,
                delay: 0,
                anchorPlacement: 'top-bottom'
            });
        }

        // Auto-expandir servicio si la URL tiene hash (ej: servicios.html#servicio-3)
        handleServiceHashOnLoad();

        // Detectar parámetro ?enviado=true para el formulario de contacto
        handleFormspreeSuccess();
    });

    /* ===================================
       HEADER STICKY CON EFECTO SCROLL
    =================================== */
    var header = document.getElementById('hv-header');

    window.addEventListener('scroll', function() {
        if (!header) return;
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    /* ===================================
       NAVEGACIÓN ACTIVA POR PÁGINA
       (Detecta la página actual desde la URL)
    =================================== */
    // La navegación activa ya está marcada en cada HTML con la clase "active"
    // pero este código lo maneja dinámicamente por si se navega con JS

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
       (Solo para anclas en la misma página)
    =================================== */
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            var targetId = this.getAttribute('href');
            if (targetId === '#' || targetId === '') return;

            var targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                var headerHeight = header ? header.offsetHeight : 0;
                var targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight - 20;

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
    window.toggleServicio = function(btn) {
        var card = btn.closest('.hv-servicio-card');
        if (!card) return;

        var detail = card.querySelector('.hv-servicio-detail');
        if (!detail) return;

        var isExpanded = card.classList.contains('expanded');

        // Cerrar todas las tarjetas expandidas primero
        document.querySelectorAll('.hv-servicio-card.expanded').forEach(function(openCard) {
            if (openCard !== card) {
                openCard.classList.remove('expanded');
                var openDetail = openCard.querySelector('.hv-servicio-detail');
                if (openDetail) {
                    openDetail.style.display = 'none';
                }
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
                if (typeof AOS !== 'undefined') {
                    AOS.refresh();
                }
            }, 100);
        }
    };

    /* ===================================
       AUTO-EXPANDIR SERVICIO DESDE HASH URL
       (ej: servicios.html#servicio-3)
    =================================== */
    function handleServiceHashOnLoad() {
        var hash = window.location.hash;
        if (!hash || !hash.startsWith('#servicio-')) return;

        var targetCard = document.querySelector(hash);
        if (!targetCard || !targetCard.classList.contains('hv-servicio-card')) return;

        // Esperar a que la página termine de cargar y AOS se inicialice
        setTimeout(function() {
            var detail = targetCard.querySelector('.hv-servicio-detail');
            if (!detail) return;

            // Expandir la tarjeta
            targetCard.classList.add('expanded');
            detail.style.display = 'block';

            var verMasBtn = targetCard.querySelector('.hv-servicio-body .hv-btn-outline');
            if (verMasBtn) {
                verMasBtn.innerHTML = 'Ver menos <i class="fa fa-minus"></i>';
            }

            // Scroll hacia la tarjeta
            var headerHeight = header ? header.offsetHeight : 0;
            var cardTop = targetCard.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
            window.scrollTo({
                top: cardTop,
                behavior: 'smooth'
            });

            // Refresh AOS
            if (typeof AOS !== 'undefined') {
                AOS.refresh();
            }
        }, 500);
    }

    // También escuchar cambios de hash en tiempo real (ej: clic en footer)
    window.addEventListener('hashchange', function() {
        handleServiceHashOnLoad();
    });

    /* ===================================
       BOTÓN SCROLL TO TOP
    =================================== */
    var scrollTopBtn = document.getElementById('scrollTop');

    window.addEventListener('scroll', function() {
        if (!scrollTopBtn) return;
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

    window.addEventListener('scroll', function() {
        if (!whatsappBtn) return;
        if (window.scrollY > 200) {
            whatsappBtn.classList.add('visible');
        } else {
            whatsappBtn.classList.remove('visible');
        }
    });

    // Mostrar después de 2 segundos aunque no haya scroll
    setTimeout(function() {
        if (whatsappBtn) {
            whatsappBtn.classList.add('visible');
        }
    }, 2000);

    /* ===================================
       FORMSPREE: DETECCIÓN DE ENVÍO EXITOSO
       (La página contacto.html redirige a
        contacto.html?enviado=true después del
        envío exitoso en Formspree)
    =================================== */
    function handleFormspreeSuccess() {
        var urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('enviado') !== 'true') return;

        var successMsg = document.getElementById('formSuccessMessage');
        var contactForm = document.getElementById('contactForm');

        if (successMsg) {
            successMsg.style.display = 'block';
        }
        if (contactForm) {
            contactForm.style.display = 'none';
        }

        // Limpiar el parámetro de la URL sin recargar la página
        if (window.history && window.history.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

})();
