import products from '../../entities/products-data.json';
import services from '../../entities/services-data.json';

export async function listProducts() {
    // Return products as-is; `image_url` will be taken from `entities/products-data.json`.
    return products || [];
}

export async function listServices() {
    return services || [];
}

export default { listProducts, listServices };
