import { apiClient, authClient, API_ENDPOINTS } from '../../config/apiConfig.js';
import { cacheService, CACHE_TTL } from '../cacheService.js';
import { fallbackManager } from '../fallbackManager.js';

//Anda
export async function fetchEmployee() {
    return fallbackManager.withFallback(
        () => apiClient.get(`${API_ENDPOINTS.USER}/employees`).then(res => res.data),
        'employees_list',
        {
            endpoint: 'employees',
            fallbackData: { status: 'success', data: [], message: 'No hay empleados disponibles sin conexión' }
        }
    );
}

export async function fetchEmployeeById(id) {
    const cacheKey = `employee_${id}`;

    return fallbackManager.withFallback(
        () => apiClient.get(`${API_ENDPOINTS.USER}/employee/${id}`).then(res => res.data),
        cacheKey,
        {
            endpoint: `employee/${id}`,
            fallbackData: null // Fallar si no hay caché para empleado específico
        }
    );
}

export async function postData(data) {
    const response = await apiClient.post(`${API_ENDPOINTS.USER}/employees`, data);

    // Invalidar caché de empleados
    cacheService.delete('employees_list');

    return response.data;
}
//Anda
export async function putData(id, data) {
    const response = await apiClient.put(`${API_ENDPOINTS.USER}/${id}`, data);

    // Invalidar caché del empleado específico y lista
    cacheService.delete(`employee_${id}`);
    cacheService.delete('employees_list');

    return response.data;
}
//Anda
export async function deleteData(id) {
    const response = await apiClient.delete(`${API_ENDPOINTS.USER}/${id}`);

    // Invalidar caché del empleado específico y lista
    cacheService.delete(`employee_${id}`);
    cacheService.delete('employees_list');

    return response.data;
}

// Get employee's assigned storages
export async function fetchEmployeeStorages(employeeId) {
    const cacheKey = `employee_storages_${employeeId}`;

    return fallbackManager.withFallback(
        () => apiClient.get(`${API_ENDPOINTS.USER}/employee/${employeeId}/storages`).then(res => res.data),
        cacheKey,
        {
            endpoint: `employee/${employeeId}/storages`,
            fallbackData: {
                status: 'success',
                data: [
                    { id: 1, name: 'Sucursal Principal', description: 'Sucursal por defecto' }
                ],
                message: 'Datos de sucursales de fallback'
            },
            maxCacheAge: 60 * 60 * 1000 // 1 hora de cache de emergencia
        }
    );
}

// Assign storage to employee
export async function assignStorageToEmployee(employeeId, storageId) {
    const response = await apiClient.post(`${API_ENDPOINTS.USER}/employee/${employeeId}/storages`, {
        storage_id: storageId
    });

    // Invalidar caché de asignaciones
    cacheService.delete(`employee_storages_${employeeId}`);

    return response.data;
}

export async function removeStorageFromEmployee(employeeId, storageId) {
    const response = await apiClient.delete(`${API_ENDPOINTS.USER}/employee/${employeeId}/storages/${storageId}`);

    // Invalidar caché de asignaciones
    cacheService.delete(`employee_storages_${employeeId}`);

    return response.data;
}

export async function fetchEmployeeByUsername(username) {
    const cacheKey = `employee_username_${username}`;

    // Usar authClient para operaciones de autenticación (timeout más largo)
    return fallbackManager.authFallback(
        async () => {
            const response = await authClient.get(`${API_ENDPOINTS.USER}/employee/username/${username}`);

            // Cachear resultado exitoso
            cacheService.set(cacheKey, response.data, CACHE_TTL.MEDIUM);

            return response.data;
        },
        username
    );
}
