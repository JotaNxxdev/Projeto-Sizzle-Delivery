document.addEventListener('DOMContentLoaded', () => {

    // Dados de exemplo dos restaurantes
    const restaurants = [
        {
            id: '1',
            name: 'Pizzaria Nostra',
            category: 'pizza',
            rating: 4.9,
            deliveryTime: '20-30 min',
            deliveryFee: 5.00,
            image: 'unnamed.png',
            menu: [
                { name: 'Pizza Calabresa', price: 35.00, description: 'Calabresa, cebola e azeitona.', image: '1.png' },
                { name: 'Pizza Margherita', price: 40.00, description: 'Tomate, mussarela e manjericão.', image: '2.png' },
            ]
        },
        {
            id: '2',
            name: 'Lanchonete Express',
            category: 'lanches',
            rating: 4.7,
            deliveryTime: '15-25 min',
            deliveryFee: 0.00,
            image: 'express.png',
            menu: [
                { name: 'X-Bacon', price: 20.00, description: 'Hambúrguer, bacon, queijo e salada.', image: 'https://via.placeholder.com/100/D9BF1C?text=X-Bacon' },
                { name: 'Cachorro-Quente', price: 15.00, description: 'Salsicha, pão e molho.', image: 'https://via.placeholder.com/100/F26666?text=HotDog' },
            ]
        },
        {
            id: '3',
            name: 'Comida Japonesa Kori',
            category: 'japonesa',
            rating: 4.6,
            deliveryTime: '35-45 min',
            deliveryFee: 8.00,
            image: 'kori.png',
            menu: [
                { name: 'Combinado Sushi', price: 85.00, description: '20 peças de sushi e sashimi.', image: 'https://via.placeholder.com/100/808080?text=Sushi' },
                { name: 'Temaki Salmão', price: 25.00, description: 'Cone de arroz com salmão e cream cheese.', image: 'https://via.placeholder.com/100/FF69B4?text=Temaki' },
            ]
        },
        {
            id: '4',
            name: 'Bar do Dedé',
            category: 'brasileira',
            rating: 4.8,
            deliveryTime: '35-45 min',
            deliveryFee: 15.00,
            image: 'unnamed (1).png',
            menu: [
                { name: 'Bisteca acompanhada', price: 15.00, description: 'Prato completo com bisteca.', image: 'https://via.placeholder.com/100/808080?text=Sushi' },
                { name: 'Lasanha', price: 25.00, description: 'Prato acompanhado com lasanha.', image: 'https://via.placeholder.com/100/FF69B4?text=Temaki' },
            ]
        }
    ];

    // Variáveis globais do DOM
    const searchInput = document.getElementById('searchInput');
    const restaurantList = document.getElementById('restaurantList');
    const homeScreen = document.getElementById('home-screen');
    const restaurantMenuScreen = document.getElementById('restaurant-menu-screen');
    const restaurantNameHeader = document.getElementById('restaurant-name-header');
    const restaurantMenuContent = document.getElementById('restaurant-menu-content');
    const backButton = document.querySelector('.back-button');
    const navItems = document.querySelectorAll('.nav-item');
    const categoryItems = document.querySelectorAll('.category-item');

    // Variáveis do DOM para o carrinho e checkout
    const cartItemsList = document.getElementById('cart-items-list');
    const backButtonCart = document.querySelector('.back-button-cart');
    const subtotalPrice = document.getElementById('subtotal-price');
    const deliveryFeePrice = document.getElementById('delivery-fee-price');
    const totalPrice = document.getElementById('total-price');
    const checkoutButton = document.querySelector('.checkout-button');
    const placeOrderButton = document.getElementById('place-order-button');
    const backButtonCheckout = document.querySelector('.back-button-checkout');
    
    // Variáveis do DOM para a nova tela de pedidos
    const backButtonOrders = document.querySelector('.back-button-orders');
    const ordersList = document.getElementById('orders-list');
    const orderNotes = document.getElementById('order-notes');
    const contactNumber = document.getElementById('contact-number');
    const deliveryAddress = document.getElementById('delivery-address');


    let cart = [];
    let currentRestaurant = null;
    
    // --- LÓGICA DE CARREGAMENTO E SALVAMENTO COM LOCALSTORAGE ---
    let orders = JSON.parse(localStorage.getItem('orders')) || [];

    function saveOrders() {
        localStorage.setItem('orders', JSON.stringify(orders));
    }
    // --- FIM DA LÓGICA DO LOCALSTORAGE ---

    function generateOrderId() {
        return 'PED-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    function finalizeOrder() {
        if (cart.length === 0) {
            alert("Não há itens no carrinho.");
            navigateToScreen('home-screen');
            return;
        }

        const newOrder = {
            id: generateOrderId(),
            restaurantName: currentRestaurant.name,
            items: [...cart],
            notes: orderNotes.value,
            contact: contactNumber.value,
            address: deliveryAddress.value,
            status: 'Pendente',
            date: new Date().toLocaleString()
        };

        orders.unshift(newOrder); // Adiciona o novo pedido no início do array
        saveOrders(); // Salva os pedidos no localStorage
        
        cart = [];
        orderNotes.value = '';
        contactNumber.value = '';
        deliveryAddress.value = '';

        navigateToScreen('orders-screen');
        renderOrders();
    }
    
    function renderOrders() {
        ordersList.innerHTML = '';
        if (orders.length === 0) {
            ordersList.innerHTML = '<p style="text-align: center; color: #999;">Você ainda não fez nenhum pedido.</p>';
        } else {
            orders.forEach(order => {
                const orderDiv = document.createElement('div');
                orderDiv.classList.add('order-item');
                let statusClass = '';
                switch(order.status) {
                    case 'Pendente': statusClass = 'pending'; break;
                    case 'Em Preparação': statusClass = 'in-progress'; break;
                    case 'Entregue': statusClass = 'delivered'; break;
                }

                const itemsHtml = order.items.map(item => `<li>${item.quantity}x ${item.name} (R$ ${item.price.toFixed(2).replace('.', ',')})</li>`).join('');

                orderDiv.innerHTML = `
                    <div class="order-header">
                        <h4>Pedido #${order.id}</h4>
                        <span class="order-status ${statusClass}">${order.status}</span>
                    </div>
                    <div class="order-details">
                        <p><strong>Restaurante:</strong> ${order.restaurantName}</p>
                        <p><strong>Data:</strong> ${order.date}</p>
                        <p><strong>Observações:</strong> ${order.notes || 'Nenhuma'}</p>
                        <p><strong>Endereço:</strong> ${order.address || 'Não informado'}</p>
                        <p><strong>Itens:</strong></p>
                        <ul>${itemsHtml}</ul>
                    </div>
                `;
                ordersList.appendChild(orderDiv);
            });
        }
    }

    function addToCart(item) {
        const existingItem = cart.find(cartItem => cartItem.name === item.name);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...item, quantity: 1, restaurantId: currentRestaurant.id });
        }
        
        navigateToScreen('cart-screen');
        renderCartItems();
    }

    function renderCartItems() {
        cartItemsList.innerHTML = '';
        let subtotal = 0;

        if (cart.length === 0) {
            cartItemsList.innerHTML = '<p style="text-align: center; color: #999;">Seu carrinho está vazio.</p>';
        } else {
            cart.forEach(item => {
                const cartItem = document.createElement('div');
                cartItem.classList.add('cart-item');
                cartItem.innerHTML = `
                    <img src="${item.image}" alt="${item.name}">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p>R$ ${item.price.toFixed(2).replace('.', ',')}</p>
                    </div>
                    <div class="item-quantity-price">
                        <div class="item-quantity-control">
                            <button class="quantity-btn minus-btn" data-item-name="${item.name}">-</button>
                            <span class="item-quantity">${item.quantity}</span>
                            <button class="quantity-btn plus-btn" data-item-name="${item.name}">+</button>
                        </div>
                        <span class="item-price">R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                    </div>
                `;
                cartItemsList.appendChild(cartItem);
                
                const minusBtn = cartItem.querySelector('.minus-btn');
                const plusBtn = cartItem.querySelector('.plus-btn');

                minusBtn.addEventListener('click', () => {
                    updateItemQuantity(item.name, -1);
                });

                plusBtn.addEventListener('click', () => {
                    updateItemQuantity(item.name, 1);
                });

                subtotal += item.price * item.quantity;
            });
        }
        
        renderCartSummary(subtotal);
    }

    function updateItemQuantity(itemName, delta) {
        const item = cart.find(cartItem => cartItem.name === itemName);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                cart = cart.filter(cartItem => cartItem.name !== itemName);
            }
            renderCartItems();
        }
    }

    function renderCartSummary(subtotal) {
        let deliveryFee = 0;
        if (cart.length > 0) {
            const firstItem = cart[0];
            const restaurant = restaurants.find(r => r.id === firstItem.restaurantId);
            if (restaurant) {
                deliveryFee = restaurant.deliveryFee;
            }
        }
        
        const total = subtotal + deliveryFee;

        subtotalPrice.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
        deliveryFeePrice.textContent = deliveryFee > 0 ? `R$ ${deliveryFee.toFixed(2).replace('.', ',')}` : 'Grátis';
        totalPrice.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    }

    // Função de navegação entre telas
    function navigateToScreen(targetId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(targetId).classList.add('active');
    }

    // Navegação via barra de menu inferior
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            navigateToScreen(item.dataset.screen);
            
            if (item.dataset.screen === 'cart-screen') {
                renderCartItems();
            }
            if (item.dataset.screen === 'orders-screen') {
                renderOrders();
            }
        });
    });

    // Função para renderizar os cards dos restaurantes
    function renderRestaurantCards(restaurantsToRender) {
        restaurantList.innerHTML = '';
        restaurantsToRender.forEach(restaurant => {
            const card = document.createElement('div');
            card.classList.add('restaurant-card');
            card.dataset.id = restaurant.id;
            card.dataset.name = restaurant.name;
            card.dataset.category = restaurant.category;
            card.innerHTML = `
                <img src="${restaurant.image}" alt="${restaurant.name}">
                <div class="card-info">
                    <h3>${restaurant.name}</h3>
                    <p class="details">
                        <i class="fas fa-star rating-icon"></i> ${restaurant.rating} • ${restaurant.deliveryTime} • R$ ${restaurant.deliveryFee.toFixed(2).replace('.', ',')}
                    </p>
                </div>
            `;
            restaurantList.appendChild(card);
            
            card.addEventListener('click', () => {
                currentRestaurant = restaurant;
                renderRestaurantMenu(restaurant);
                navigateToScreen('restaurant-menu-screen');
            });
        });
    }

    // Função para renderizar o menu do restaurante
    function renderRestaurantMenu(restaurant) {
        restaurantNameHeader.textContent = restaurant.name;
        restaurantMenuContent.innerHTML = '';

        restaurant.menu.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.classList.add('menu-item');
            menuItem.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div class="menu-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.description}</p>
                </div>
                <div class="menu-item-price">
                    <span>R$ ${item.price.toFixed(2).replace('.', ',')}</span>
                    <button class="add-to-cart-button" data-item-name="${item.name}">Adicionar</button>
                </div>
            `;
            restaurantMenuContent.appendChild(menuItem);
            
            const button = menuItem.querySelector('.add-to-cart-button');
            button.addEventListener('click', () => {
                addToCart(item);
            });
        });
    }

    // Lógica da barra de pesquisa
    searchInput.addEventListener('keyup', (event) => {
        const searchTerm = event.target.value.toLowerCase();
        const filteredRestaurants = restaurants.filter(r => 
            r.name.toLowerCase().includes(searchTerm) || 
            r.category.toLowerCase().includes(searchTerm)
        );
        renderRestaurantCards(filteredRestaurants);
    });

    // Lógica para filtrar por categorias
    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            const category = item.dataset.category;
            const filteredRestaurants = restaurants.filter(r => r.category.toLowerCase() === category.toLowerCase());
            renderRestaurantCards(filteredRestaurants);
        });
    });

    // Eventos de clique para os botões de voltar
    backButton.addEventListener('click', () => {
        navigateToScreen('home-screen');
    });

    backButtonCart.addEventListener('click', () => {
        navigateToScreen('restaurant-menu-screen');
    });
    
    backButtonCheckout.addEventListener('click', () => {
        navigateToScreen('cart-screen');
    });
    
    backButtonOrders.addEventListener('click', () => {
        navigateToScreen('home-screen');
    });

    // Lógica do botão de checkout
    checkoutButton.addEventListener('click', () => {
        if (cart.length > 0) {
            navigateToScreen('checkout-screen');
        } else {
            alert('Seu carrinho está vazio. Adicione itens para continuar.');
        }
    });

    // Lógica do botão 'Confirmar Pedido'
    placeOrderButton.addEventListener('click', () => {
        finalizeOrder();
    });

    // Renderiza os cards iniciais
    renderRestaurantCards(restaurants);

    // Lógica do carrossel automático
    const highlightCarousel = document.querySelector('.highlight-carousel');
    const scrollSpeed = 0.6;
    const intervalTime = 20;

    setInterval(() => {
        if (highlightCarousel.scrollLeft + highlightCarousel.clientWidth >= highlightCarousel.scrollWidth) {
            highlightCarousel.scrollLeft = 0;
        } else {
            highlightCarousel.scrollLeft += scrollSpeed;
        }
    }, intervalTime);

    // Obtém os elementos para a funcionalidade de upload de foto
const uploadButton = document.getElementById('upload-button');
const fileInput = document.getElementById('file-input');
const profileImage = document.getElementById('profile-image');

// Carregar a imagem salva do localStorage, se existir
const savedImage = localStorage.getItem('profileImage');
if (savedImage) {
    profileImage.src = savedImage;
}

// Quando o botão de upload é clicado, dispara o input de arquivo
uploadButton.addEventListener('click', () => {
    fileInput.click();
});

// Quando um arquivo é selecionado no input, lê e exibe a imagem
fileInput.addEventListener('change', (event) => {
    const file = event.target.files?.[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            // Define a fonte da imagem como a URL do arquivo selecionado
            profileImage.src = e.target.result;
            // Salva a imagem no armazenamento local para que ela persista
            localStorage.setItem('profileImage', e.target.result);
        };

        // Lê o arquivo como uma URL de dados (Base64)
        reader.readAsDataURL(file);
    }
});
});