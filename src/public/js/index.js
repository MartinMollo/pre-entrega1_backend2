const socket = io();


document.getElementById('productForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    fetch('/api/products', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(product => {
            console.log('Se agrego el producto:', product);
            AddProduct(product);
        })
        .catch(err => console.error('Error agregando el producto:', err));

    event.target.reset();
});

function AddProduct(product) {
    const productList = document.getElementById('products');
    if (!productList) {
        console.error('No se encontro la lista del producto');
        return;
    }
    const productItem = document.createElement('div');
    productItem.className = 'col-md-3';
    productItem.id = `product-${product._id}`;
    productItem.innerHTML = `
        <div class="shadow-lg p-3 mb-5 bg-body-tertiary rounded">
            <div class="product_square">
                <h5 class="product-title">${product.title}</h5>
                <p class="product-desc">${product.description}</p>
                <p class="product-text"><strong>Code:</strong> ${product.code}</p>
                <p class="product-text"><strong>Price:</strong> $${product.price}</p>
                <p class="product-text"><strong>Stock:</strong> <span id="stock-${product._id}">${product.stock}</span></p>
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <button class="btn btn-info" onclick="ViewDetails('${product._id}')">Ver mas..</button>
                        <button class="btn btn-success" onclick="PromptAddToCart('${product._id}')">Agregar al carrito</button>
                        <button class="btn btn-danger" onclick="ConfirmRemoveProduct('${product._id}')">Borrar</button>
                    </div>
                </div>
            </div>
        </div>`;
    productList.appendChild(productItem);
}

function UpdateStock(productId, newStock) {
    const stockElement = document.getElementById(`stock-${productId}`);
    if (stockElement) {
        stockElement.textContent = newStock;
    }
}

function UpdateCartProducts(cart) {
    const cartList = document.getElementById('cart-items');
    const emptyCartMessage = document.getElementById('empty-cart');
    if (!cartList) {
        console.error('El producto del carrito no se encontró');
        return;
    }
    cartList.innerHTML = '';

    if (!cart || !cart.products || cart.products.length === 0) {
        emptyCartMessage.style.display = 'block';
    } else {
        emptyCartMessage.style.display = 'none';
        cart.products.forEach(item => {
            const product = item.product;
            const cartItem = document.createElement('li');
            cartItem.className = 'list-group-item';
            cartItem.id = `cart-${product._id}`;
            cartItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>Title:</strong> ${product.title || 'undefined'} <br>
                        <strong>Quantity:</strong> <span id="cart-quantity-${product._id}">${item.quantity}</span>
                    </div>
                    <div>
                        <button class="btn btn-danger" onclick="PromptRemoveFromCart('${product._id}')">Eliminar</button>
                    </div>
                </div>`;
            cartList.appendChild(cartItem);
        });
    }
}

function UpdateCartQuantity(productId, newQuantity) {
    const quantityElement = document.getElementById(`cart-quantity-${productId}`);
    if (quantityElement) {
        quantityElement.textContent = newQuantity;
    }
}

function PromptAddToCart(productId) {
    Swal.fire({
        title: 'Cuantos productos quiere agregar?',
        input: 'number',
        inputAttributes: {
            min: 1
        },
        showCancelButton: true,
        confirmButtonText: 'Agregar al carrito',
        cancelButtonText: 'Cancelar',
        preConfirm: (quantity) => {
            return AddToCart(productId, parseInt(quantity, 10));
        }
    });
}

function PromptRemoveFromCart(productId) {
    Swal.fire({
        title: 'Cuantos productos quiere eliminar?',
        input: 'number',
        inputAttributes: {
            min: 1
        },
        showCancelButton: true,
        confirmButtonText: 'Eliminar del Carrito',
        cancelButtonText: 'Cancelar',
        preConfirm: (quantity) => {
            return RemoveFromCart(productId, parseInt(quantity, 10));
        }
    });
}

function ConfirmRemoveProduct(productId) {
    Swal.fire({
        title: 'Seguro/a que quieres borrar el producto de forma permanente?',
        showCancelButton: true,
        confirmButtonText: 'Si',
        cancelButtonText: 'No'
    }).then((result) => {
        if (result.isConfirmed) {
            RemoveProduct(productId);
        }
    });
}

function AddToCart(productId, quantity) {
    fetch(`/api/carts/add/${productId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity: quantity })
    })
        .then(response => response.json())
        .then(cart => {
            console.log('Se agregó el producto al carrito', cart);
            socket.emit('cartUpdated', cart);
        })
        .catch(error => console.error('No se pudo agregar el producto al carrito', error));
}

function ViewDetails(productId) {
    window.location.href = `/api/products/details/${productId}`;
}

function RemoveProduct(id) {
    fetch(`/api/products/${id}`, {
        method: 'DELETE'
    })
        .then(response => response.json())
        .then(result => {
            console.log('Producto eliminado', result);
            const productItem = document.getElementById(`product-${id}`);
            if (productItem) {
                productItem.remove();
            }
            socket.emit('cartUpdated');
        })
        .catch(err => console.error('No se pudo borrar el producto', err));
}

function RemoveFromCart(productId, quantity) {
    if (!productId) {
        console.error('No existe el ID del producto');
        return;
    }

    fetch(`/api/carts/remove/${productId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity: quantity })
    })
        .then(response => response.json())
        .then(cart => {
            console.log('Producto eliminado del carrito', cart);
            socket.emit('cartUpdated', cart);
        })
        .catch(err => console.error('No se pudo borrar el producto del carrito', err));
}

function ClearCart() {
    fetch('/api/carts/clear', {
        method: 'POST'
    })
        .then(response => response.json())
        .then(cart => {
            console.log('Carrito limpio', cart);
            UpdateCartProducts(cart);
            socket.emit('cartCleared');

            cart.products.forEach(item => {
                socket.emit('productUpdated', item.product);
            });
        })
        .catch(err => console.error('Error vaciando el carrito', err));
}

socket.on('productUpdated', (product) => {
    UpdateStock(product._id, product.stock);
});

function UpdateStock(productId, newStock) {
    const stockElement = document.getElementById(`stock-${productId}`);
    if (stockElement) {
        stockElement.textContent = newStock;
    }
}

function FetchProducts(page = 1, limit = 10, sort = '', query = '') {
    fetch(`/api/products?page=${page}&limit=${limit}&sort=${sort}&query=${query}`)
        .then(response => response.json())
        .then(response => {
            if (response.status === 'success') {
                const productsList = document.getElementById('products');
                if (!productsList) {
                    console.error('No se encontro el elemento de la lista de productos');
                    return;
                }
                productsList.innerHTML = '';
                response.payload.forEach(product => AddProduct(product));


                const paginationControls = document.getElementById('pagination-controls');
                if (paginationControls) {
                    paginationControls.innerHTML = `
                        <nav>
                            <ul class="pagination">
                                ${response.hasPrevPage ? `<li class="page-item"><a class="btn btn-success" href="#" onclick="FetchProducts(${response.prevPage}, ${limit}, '${sort}', '${query}')">Previous</a></li>` : ''}
                                <li class="page-item active"><a class="btn btn-success" href="#">${response.page}</a></li>
                                ${response.hasNextPage ? `<li class="page-item"><a class="btn btn-success" href="#" onclick="FetchProducts(${response.nextPage}, ${limit}, '${sort}', '${query}')">Next</a></li>` : ''}
                            </ul>
                        </nav>
                    `;
                } else {
                    console.error('Pagination controls element not found');
                }
            } else {
                console.error('Error fetching products:', response.msg);
            }
        })
        .catch(err => console.error('Error fetching products:', err));
}

socket.on('productRemoved', (data) => {
    const productItem = document.getElementById(`product-${data.id}`);
    if (productItem) {
        productItem.remove();
    }
});

socket.on('productData', (data) => {
    AddProduct(data);
});

socket.on('productUpdated', (product) => {
    UpdateStock(product._id, product.stock);
});

function UpdateStock(productId, newStock) {
    const stockElement = document.getElementById(`stock-${productId}`);
    if (stockElement) {
        stockElement.textContent = newStock;
    }
}

socket.on('cartUpdated', (cart) => {
    UpdateCartProducts(cart);
});

socket.on('cartCleared', () => {
    ClearCartUI();
});

function ClearCartUI() {
    const cartList = document.getElementById('cart-items');
    if (!cartList) {
        console.error('Cart list element not found');
        return;
    }
    cartList.innerHTML = '';
    const emptyCartMessage = document.getElementById('empty-cart');
    emptyCartMessage.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
    FetchProducts();

    fetch('/api/carts')
        .then(response => response.json())
        .then(cart => {
            if (cart) {
                UpdateCartProducts(cart);
            } else {
                UpdateCartProducts({ products: [] });
            }
        })
        .catch(err => console.error('Error fetching cart:', err));
});