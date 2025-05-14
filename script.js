// Banco de dados local utilizando localStorage
class LocalDB {
    constructor() {
        // Inicializar o banco de dados se não existir
        if (!localStorage.getItem('users')) {
            localStorage.setItem('users', JSON.stringify([]));
        }
        if (!localStorage.getItem('properties')) {
            localStorage.setItem('properties', JSON.stringify([]));
        }
        if (!localStorage.getItem('reservations')) {
            localStorage.setItem('reservations', JSON.stringify([]));
        }
    }
    
    // Métodos para usuários
    getUsers() {
        return JSON.parse(localStorage.getItem('users'));
    }
    
    addUser(user) {
        const users = this.getUsers();
        user.id = Date.now().toString();
        users.push(user);
        localStorage.setItem('users', JSON.stringify(users));
        return user;
    }
    
    getUserByEmail(email) {
        const users = this.getUsers();
        return users.find(user => user.email === email);
    }
    
    updateUser(userId, userData) {
        const users = this.getUsers();
        const index = users.findIndex(user => user.id === userId);
        if (index !== -1) {
            users[index] = { ...users[index], ...userData };
            localStorage.setItem('users', JSON.stringify(users));
            return users[index];
        }
        return null;
    }
    
    // Métodos para propriedades
    getProperties() {
        return JSON.parse(localStorage.getItem('properties'));
    }
    
    addProperty(property) {
        const properties = this.getProperties();
        property.id = Date.now().toString();
        properties.push(property);
        localStorage.setItem('properties', JSON.stringify(properties));
        return property;
    }
    
    getPropertyById(id) {
        const properties = this.getProperties();
        return properties.find(property => property.id === id);
    }
    
    getPropertiesByOwner(ownerId) {
        const properties = this.getProperties();
        return properties.filter(property => property.ownerId === ownerId);
    }
    
    updateProperty(propertyId, propertyData) {
        const properties = this.getProperties();
        const index = properties.findIndex(property => property.id === propertyId);
        if (index !== -1) {
            properties[index] = { ...properties[index], ...propertyData };
            localStorage.setItem('properties', JSON.stringify(properties));
            return properties[index];
        }
        return null;
    }
    
    deleteProperty(propertyId) {
        const properties = this.getProperties();
        const filteredProperties = properties.filter(property => property.id !== propertyId);
        localStorage.setItem('properties', JSON.stringify(filteredProperties));
        return true;
    }
    
    // Métodos para reservas
    getReservations() {
        return JSON.parse(localStorage.getItem('reservations'));
    }
    
    addReservation(reservation) {
        const reservations = this.getReservations();
        reservation.id = Date.now().toString();
        reservations.push(reservation);
        localStorage.setItem('reservations', JSON.stringify(reservations));
        return reservation;
    }
    
    getReservationsByUser(userId) {
        const reservations = this.getReservations();
        return reservations.filter(reservation => reservation.userId === userId);
    }
    
    getReservationsByProperty(propertyId) {
        const reservations = this.getReservations();
        return reservations.filter(reservation => reservation.propertyId === propertyId);
    }
}

// Gerenciador de autenticação
class AuthManager {
    constructor(db) {
        this.db = db;
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    }
    
    isLoggedIn() {
        return !!this.currentUser;
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
    
    register(userData) {
        // Verificar se o email já existe
        if (this.db.getUserByEmail(userData.email)) {
            throw new Error('Este email já está cadastrado');
        }
        
        // Criar o usuário
        const newUser = this.db.addUser(userData);
        
        // Fazer login automaticamente
        this.login(userData.email, userData.password);
        
        return newUser;
    }
    
    login(email, password) {
        const user = this.db.getUserByEmail(email);
        
        if (!user || user.password !== password) {
            throw new Error('Email ou senha inválidos');
        }
        
        // Guardar usuário na sessão
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        return user;
    }
    
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
    }
    
    updateProfile(userData) {
        if (!this.isLoggedIn()) {
            throw new Error('Usuário não está logado');
        }
        
        const updatedUser = this.db.updateUser(this.currentUser.id, userData);
        this.currentUser = updatedUser;
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        return updatedUser;
    }
}

// Gerenciador de propriedades
class PropertyManager {
    constructor(db) {
        this.db = db;
    }
    
    addProperty(propertyData) {
        return this.db.addProperty(propertyData);
    }
    
    getPropertyById(id) {
        return this.db.getPropertyById(id);
    }
    
    getPropertiesByOwner(ownerId) {
        return this.db.getPropertiesByOwner(ownerId);
    }
    
    getAllProperties() {
        return this.db.getProperties();
    }
    
    updateProperty(propertyId, propertyData) {
        return this.db.updateProperty(propertyId, propertyData);
    }
    
    deleteProperty(propertyId) {
        return this.db.deleteProperty(propertyId);
    }
    
    searchProperties(query) {
        const properties = this.db.getProperties();
        if (!query) return properties;
        
        query = query.toLowerCase();
        return properties.filter(property => {
            return (
                property.name.toLowerCase().includes(query) ||
                property.city.toLowerCase().includes(query) ||
                property.state.toLowerCase().includes(query) ||
                property.description.toLowerCase().includes(query) ||
                (property.amenities && property.amenities.some(amenity => 
                    amenity.toLowerCase().includes(query)
                ))
            );
        });
    }
}

// Gerenciador de reservas
class ReservationManager {
    constructor(db) {
        this.db = db;
    }
    
    addReservation(reservationData) {
        return this.db.addReservation(reservationData);
    }
    
    getReservationsByUser(userId) {
        return this.db.getReservationsByUser(userId);
    }
    
    getReservationsByProperty(propertyId) {
        return this.db.getReservationsByProperty(propertyId);
    }
}

// Inicialização
const db = new LocalDB();
const auth = new AuthManager(db);
const propertyManager = new PropertyManager(db);
const reservationManager = new ReservationManager(db);

// Função para atualizar a interface baseada no estado de autenticação
function updateUIBasedOnAuth() {
    const authButtons = document.querySelector('.auth-buttons');
    const profileArea = document.getElementById('profileArea');
    
    if (auth.isLoggedIn()) {
        // Usuário está logado
        authButtons.innerHTML = `
            <span>${auth.getCurrentUser().name.split(' ')[0]}</span>
            <button class="btn btn-outline" id="myProfileBtn">Meu Perfil</button>
            <button class="btn btn-outline" id="logoutBtn">Sair</button>
        `;
        
        // Adicionar listeners para os novos botões
        document.getElementById('myProfileBtn').addEventListener('click', () => {
            window.scrollTo(0, profileArea.offsetTop);
            profileArea.style.display = 'block';
            loadUserProperties();
            loadUserReservations();
            populateProfileForm();
        });
        
        document.getElementById('logoutBtn').addEventListener('click', () => {
            auth.logout();
            updateUIBasedOnAuth();
            alert('Logout realizado com sucesso!');
        });
        
        // Mostrar área do perfil
        profileArea.style.display = 'block';
        
        // Atualizar formulários com dados do usuário
        populateProfileForm();
        
        // Carregar propriedades e reservas do usuário
        loadUserProperties();
        loadUserReservations();
    } else {
        // Usuário não está logado
        authButtons.innerHTML = `
            <button class="btn btn-outline" id="loginBtn">Entrar</button>
            <button class="btn btn-primary" id="registerBtn">Cadastrar</button>
        `;
        
        // Adicionar listeners para os botões de login/cadastro
        document.getElementById('loginBtn').addEventListener('click', () => {
            document.getElementById('loginModal').style.display = 'flex';
        });
        
        document.getElementById('registerBtn').addEventListener('click', () => {
            document.getElementById('registerModal').style.display = 'flex';
        });
        
        // Esconder área do perfil
        profileArea.style.display = 'none';
    }
    
    // Atualizar visibilidade do botão de cadastro de sítio
    const registerPropertyBtn = document.getElementById('registerPropertyBtn');
    registerPropertyBtn.addEventListener('click', () => {
        if (auth.isLoggedIn()) {
            document.getElementById('siteForm').style.display = 'block';
            window.scrollTo(0, document.getElementById('siteForm').offsetTop);
        } else {
            alert('Você precisa estar logado para cadastrar um sítio');
            document.getElementById('loginModal').style.display = 'flex';
        }
    });
}

// Função para popular o formulário de perfil com dados do usuário
function populateProfileForm() {
    if (!auth.isLoggedIn()) return;
    
    const user = auth.getCurrentUser();
    document.getElementById('updateName').value = user.name || '';
    document.getElementById('updateEmail').value = user.email || '';
    document.getElementById('updatePhone').value = user.phone || '';
}

// Função para carregar as propriedades do usuário
function loadUserProperties() {
    if (!auth.isLoggedIn()) return;
    
    const userProperties = propertyManager.getPropertiesByOwner(auth.getCurrentUser().id);
    const userPropertiesContainer = document.getElementById('userProperties');
    
    if (userProperties.length === 0) {
        userPropertiesContainer.innerHTML = '<p>Você ainda não cadastrou nenhum sítio.</p>';
        return;
    }
    
    userPropertiesContainer.innerHTML = '';
    userProperties.forEach(property => {
        const propertyCard = createPropertyCard(property, true);
        userPropertiesContainer.appendChild(propertyCard);
    });
}

// Função para carregar as reservas do usuário
function loadUserReservations() {
    if (!auth.isLoggedIn()) return;
    
    const userReservations = reservationManager.getReservationsByUser(auth.getCurrentUser().id);
    const userReservationsContainer = document.getElementById('userReservations');
    
    if (userReservations.length === 0) {
        userReservationsContainer.innerHTML = '<p>Você ainda não possui reservas.</p>';
        return;
    }
    
    userReservationsContainer.innerHTML = '';
    userReservations.forEach(reservation => {
        const property = propertyManager.getPropertyById(reservation.propertyId);
        const reservationItem = document.createElement('div');
        reservationItem.className = 'message';
        reservationItem.innerHTML = `
            <h3>${property.name}</h3>
            <p><strong>Data:</strong> ${new Date(reservation.date).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${reservation.status}</p>
            <p>${reservation.message}</p>
        `;
        userReservationsContainer.appendChild(reservationItem);
    });
}

// Função para criar card de propriedade
function createPropertyCard(property, isOwner = false) {
    const card = document.createElement('div');
    card.className = 'listing-card';
    
    // Formatando o preço com vírgula
    const formattedPrice = parseFloat(property.price).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
    
    card.innerHTML = `
        <img src="${property.image || '/api/placeholder/600/400'}" alt="${property.name}" class="listing-img">
        <div class="listing-details">
            <h3 class="listing-title">${property.name}</h3>
            <p class="listing-location">${property.city}, ${property.state}</p>
            <p class="listing-price">${formattedPrice} / diária</p>
            <div class="listing-features">
                <span>Capacidade: ${property.capacity} pessoas</span>
            </div>
            <button class="btn btn-primary view-details" data-id="${property.id}">Ver Detalhes</button>
            ${isOwner ? `<button class="btn btn-outline delete-property" data-id="${property.id}">Excluir</button>` : ''}
        </div>
    `;
    
    // Adicionar listeners
    card.querySelector('.view-details').addEventListener('click', () => {
        alert(`Detalhes do sítio ${property.name}\n\n${property.description}`);
        // Aqui poderia abrir uma página de detalhes ou modal
    });
    
    if (isOwner) {
        card.querySelector('.delete-property').addEventListener('click', () => {
            if (confirm(`Tem certeza que deseja excluir o sítio ${property.name}?`)) {
                propertyManager.deleteProperty(property.id);
                loadUserProperties();
                loadFeaturedProperties(); // Atualizar a lista principal também
            }
        });
    }
    
    return card;
}

// Função para carregar sítios em destaque
function loadFeaturedProperties() {
    const featuredContainer = document.getElementById('featuredListings');
    const properties = propertyManager.getAllProperties();
    
    if (properties.length === 0) {
        // Adicionar alguns exemplos se não existirem propriedades
        if (!localStorage.getItem('demoDataAdded')) {
            addDemoProperties();
            loadFeaturedProperties();
            localStorage.setItem('demoDataAdded', 'true');
            return;
        }
        
        featuredContainer.innerHTML = '<p>Nenhum sítio cadastrado ainda.</p>';
        return;
    }
    
    featuredContainer.innerHTML = '';
    
    // Mostrar apenas 6 propriedades no máximo
    const displayProperties = properties.slice(0, 6);
    
    displayProperties.forEach(property => {
        const propertyCard = createPropertyCard(property);
        featuredContainer.appendChild(propertyCard);
    });
}

// Adicionar dados de demonstração
function addDemoProperties() {
    const demoProperties = [
        {
            name: 'Sítio Recanto do Sol',
            address: 'Estrada Municipal, km 5',
            city: 'Ibiúna',
            state: 'SP',
            capacity: 80,
            description: 'Lindo sítio com piscina, churrasqueira, salão de festas e lago para pesca. Ambiente aconchegante e tranquilo, perfeito para seu evento.',
            price: 1500,
            image: '/api/placeholder/600/400',
            amenities: ['Piscina', 'Churrasqueira', 'Salão de festas', 'Lago para pesca'],
            ownerId: 'demo',
            id: 'demo1'
        },
        {
            name: 'Espaço Verde Horizonte',
            address: 'Rodovia das Flores, km 15',
            city: 'Jundiaí',
            state: 'SP',
            capacity: 120,
            description: 'Amplo espaço com infraestrutura completa para festas e eventos. Piscina, playground, quadra de esportes e muito mais!',
            price: 2200,
            image: '/api/placeholder/600/400',
            amenities: ['Piscina', 'Playground', 'Quadra esportiva', 'Estacionamento'],
            ownerId: 'demo',
            id: 'demo2'
        },
        {
            name: 'Sítio Bem-Te-Vi',
            address: 'Estrada do Jacarandá, 250',
            city: 'Cotia',
            state: 'SP',
            capacity: 60,
            description: 'Sítio aconchegante cercado pela natureza. Local ideal para eventos menores e mais intimistas.',
            price: 900,
            image: '/api/placeholder/600/400',
            amenities: ['Churrasqueira', 'Piscina', 'Cozinha equipada'],
            ownerId: 'demo',
            id: 'demo3'
        }
    ];
    
    // Adicionar ao banco de dados
    const propertiesInDB = db.getProperties();
    localStorage.setItem('properties', JSON.stringify([...propertiesInDB, ...demoProperties]));
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar a interface baseada no estado de autenticação
    updateUIBasedOnAuth();
    
    // Carregar propriedades em destaque
    loadFeaturedProperties();
    
    // Modal de Login
    const loginModal = document.getElementById('loginModal');
    document.getElementById('loginBtn')?.addEventListener('click', () => {
        loginModal.style.display = 'flex';
    });
    
    document.getElementById('closeLoginModal').addEventListener('click', () => {
        loginModal.style.display = 'none';
    });
    
    document.getElementById('showRegisterModal').addEventListener('click', (e) => {
        e.preventDefault();
        loginModal.style.display = 'none';
        document.getElementById('registerModal').style.display = 'flex';
    });
    
    // Modal de Cadastro
    const registerModal = document.getElementById('registerModal');
    document.getElementById('registerBtn')?.addEventListener('click', () => {
        registerModal.style.display = 'flex';
    });
    
    document.getElementById('closeRegisterModal').addEventListener('click', () => {
        registerModal.style.display = 'none';
    });
    
    document.getElementById('showLoginModal').addEventListener('click', (e) => {
        e.preventDefault();
        registerModal.style.display = 'none';
        loginModal.style.display = 'flex';
    });
    
    // Fechar modais quando clicar fora
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            loginModal.style.display = 'none';
        }
        if (e.target === registerModal) {
            registerModal.style.display = 'none';
        }
    });
    
    // Form de Login
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            auth.login(email, password);
            loginModal.style.display = 'none';
            updateUIBasedOnAuth();
            alert('Login realizado com sucesso!');
        } catch (error) {
            alert(error.message);
        }
    });
    
    // Form de Cadastro
    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const phone = document.getElementById('registerPhone').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        
        if (password !== confirmPassword) {
            alert('As senhas não coincidem');
            return;
        }
        
        try {
            auth.register({ name, email, phone, password });
            registerModal.style.display = 'none';
            updateUIBasedOnAuth();
            alert('Cadastro realizado com sucesso!');
        } catch (error) {
            alert(error.message);
        }
    });
    
    // Form de Cadastro de Sítio
    document.getElementById('propertyForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (!auth.isLoggedIn()) {
            alert('Você precisa estar logado para cadastrar um sítio');
            return;
        }
        
        const name = document.getElementById('propertyName').value;
        const address = document.getElementById('propertyAddress').value;
        const city = document.getElementById('propertyCity').value;
        const state = document.getElementById('propertyState').value;
        const capacity = document.getElementById('propertyCapacity').value;
        const description = document.getElementById('propertyDescription').value;
        const price = document.getElementById('propertyPrice').value;
        const image = document.getElementById('propertyImage').value;
        
        // Coletar comodidades marcadas
        const amenities = [];
        document.querySelectorAll('.amenities-list input[type="checkbox"]:checked').forEach(checkbox => {
            amenities.push(checkbox.value);
        });
        
        const propertyData = {
            name,
            address,
            city,
            state,
            capacity,
            description,
            price,
            image,
            amenities,
            ownerId: auth.getCurrentUser().id
        };
        
        propertyManager.addProperty(propertyData);
        
        // Resetar formulário
        document.getElementById('propertyForm').reset();
        document.getElementById('siteForm').style.display = 'none';
        
        // Atualizar listas de propriedades
        loadFeaturedProperties();
        loadUserProperties();
        
        alert('Sítio cadastrado com sucesso!');
    });
    
    // Botão para adicionar nova propriedade (na área de perfil)
    document.getElementById('addNewPropertyBtn').addEventListener('click', () => {
        document.getElementById('siteForm').style.display = 'block';
        window.scrollTo(0, document.getElementById('siteForm').offsetTop);
    });
    
    // Form de atualização de perfil
    document.getElementById('updateProfileForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('updateName').value;
        const phone = document.getElementById('updatePhone').value;
        
        try {
            auth.updateProfile({ name, phone });
            updateUIBasedOnAuth();
            alert('Perfil atualizado com sucesso!');
        } catch (error) {
            alert(error.message);
        }
    });
    
    // Tabs na área de perfil
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // Remover classe active de todas as tabs
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            // Adicionar classe active na tab clicada
            tab.classList.add('active');
            
            // Esconder todos os conteúdos de tab
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Mostrar o conteúdo correspondente
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Barra de pesquisa
    const searchInput = document.querySelector('.search-input');
    const searchButton = searchInput.nextElementSibling;
    
    searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim();
        const searchResults = propertyManager.searchProperties(query);
        
        const featuredContainer = document.getElementById('featuredListings');
        featuredContainer.innerHTML = '';
        
        if (searchResults.length === 0) {
            featuredContainer.innerHTML = '<p>Nenhum resultado encontrado.</p>';
            return;
        }
        
        searchResults.forEach(property => {
            const propertyCard = createPropertyCard(property);
            featuredContainer.appendChild(propertyCard);
        });
        
        // Scroll para os resultados
        window.scrollTo(0, document.querySelector('.featured').offsetTop);
    });
    
    // Também buscar ao pressionar Enter
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchButton.click();
        }
    });
});