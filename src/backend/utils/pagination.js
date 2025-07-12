/**
 * Utilidades para manejo de paginación y búsqueda
 * Proporciona funciones para paginar resultados y aplicar filtros de búsqueda
 */

/**
 * Calcula los parámetros de paginación
 * @param {number} page - Página actual
 * @param {number} limit - Elementos por página
 * @param {number} totalItems - Total de elementos
 * @returns {object} - Objeto con parámetros de paginación calculados
 */
const calculatePagination = (page, limit, totalItems) => {
  const totalPages = Math.ceil(totalItems / limit);
  const adjustedPage = page > totalPages && totalPages > 0 ? totalPages : page;
  const skip = (adjustedPage - 1) * limit;
  
  return {
    skip,
    limit,
    totalPages,
    adjustedPage,
    totalItems
  };
};

/**
 * Extrae parámetros de paginación desde la query de la petición
 * @param {object} req - Objeto request de Express
 * @returns {object} - Objeto con parámetros extraídos
 */
const getPaginationParams = (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const searchTerm = req.query.searchTerm || '';
  const filters = req.query.filters ? JSON.parse(decodeURIComponent(req.query.filters)) : {};
  
  return {
    page,
    limit,
    searchTerm,
    filters
  };
};

/**
 * Construye una query completa combinando búsqueda y filtros
 * @param {object} req - Objeto request de Express
 * @param {array} searchFields - Campos donde buscar
 * @param {object} additionalQuery - Query adicional (opcional)
 * @returns {object} - Query completa para MongoDB
 */
const buildCompleteQuery = (req, searchFields, additionalQuery = {}) => {
  const { searchTerm, filters } = getPaginationParams(req);
  
  // Construir query de búsqueda
  let searchQuery = {};
  if (searchTerm) {
    const searchConditions = searchFields.map(field => ({
      [field]: { $regex: searchTerm, $options: 'i' }
    }));
    searchQuery = { $or: searchConditions };
  }
  
  // Construir query de filtros
  let filterQuery = {};
  if (filters && typeof filters === 'object') {
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key].length > 0) {
        filterQuery[key] = { $in: filters[key] };
      }
    });
  }
  
  return {
    ...additionalQuery,
    ...searchQuery,
    ...filterQuery
  };
};

/**
 * Maneja la respuesta paginada para un modelo
 * @param {object} res - Objeto response de Express
 * @param {object} Model - Modelo de Mongoose
 * @param {object} query - Query para filtrar resultados
 * @param {object} options - Opciones adicionales (select, sort)
 * @returns {object} - Objeto con datos paginados y metadatos
 */
const handlePaginatedResponse = async (res, Model, query, options = {}) => {
  try {
    const { page, limit } = getPaginationParams(res.req);
    
    const totalItems = await Model.countDocuments(query);
    const { skip, totalPages, adjustedPage } = calculatePagination(page, limit, totalItems);
    
    const data = await Model.find(query)
      .select(options.select || '')
      .sort(options.sort || {})
      .skip(skip)
      .limit(limit);
    
    return {
      data,
      totalItems,
      totalPages,
      currentPage: adjustedPage
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  calculatePagination,
  getPaginationParams,
  buildCompleteQuery,
  handlePaginatedResponse
}; 