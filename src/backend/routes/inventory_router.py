from flask import Blueprint, request, jsonify
from database.database import Database

inventory_router = Blueprint("inventory_router", __name__)


@inventory_router.route("/products-by-storage", methods=["GET"])
def get_products_by_storage():
    """
    Obtiene todos los productos con sus cantidades por sucursal
    """
    try:
        storage_id = request.args.get("storage_id")

        db = Database()

        if storage_id:
            # Obtener productos de una sucursal específica
            query = """
            SELECT 
                p.id,
                p.product_name as producto,
                b.brand_name as marca,
                ws.quantity as cantidad,
                s.name as sucursal,
                s.id as sucursal_id,
                p.last_modified_date as fecha,
                GROUP_CONCAT(DISTINCT c.color_name, ', ') as colores
            FROM warehouse_stock ws
            JOIN products p ON ws.product_id = p.id
            JOIN storage s ON ws.branch_id = s.id
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN product_colors pc ON p.id = pc.product_id
            LEFT JOIN colors c ON pc.color_id = c.id
            WHERE ws.branch_id = ?
            GROUP BY p.id, ws.branch_id
            ORDER BY p.product_name
            """
            products = db.execute_query(query, (storage_id,))
        else:
            # Obtener todos los productos con sus cantidades por sucursal
            query = """
            SELECT 
                p.id,
                p.product_name as producto,
                b.brand_name as marca,
                ws.quantity as cantidad,
                s.name as sucursal,
                s.id as sucursal_id,
                p.last_modified_date as fecha,
                GROUP_CONCAT(DISTINCT c.color_name, ', ') as colores
            FROM warehouse_stock ws
            JOIN products p ON ws.product_id = p.id
            JOIN storage s ON ws.branch_id = s.id
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN product_colors pc ON p.id = pc.product_id
            LEFT JOIN colors c ON pc.color_id = c.id
            GROUP BY p.id, ws.branch_id
            ORDER BY p.product_name, s.name
            """
            products = db.execute_query(query)

        return jsonify({"status": "success", "data": products}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@inventory_router.route("/storage-list", methods=["GET"])
def get_storage_list():
    """
    Obtiene la lista de todas las sucursales/almacenes
    """
    try:
        db = Database()
        query = """
        SELECT id, name, address, description, status
        FROM storage
        WHERE status = 'Activo'
        ORDER BY name
        """
        storages = db.execute_query(query)

        return jsonify({"status": "success", "data": storages}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@inventory_router.route("/product-stock/<int:product_id>", methods=["GET"])
def get_product_stock_by_storage(product_id):
    """
    Obtiene el stock de un producto específico en todas las sucursales
    """
    try:
        db = Database()
        query = """
        SELECT 
            ws.id,
            p.product_name as producto,
            s.name as sucursal,
            s.id as sucursal_id,
            ws.quantity as cantidad,
            ws.last_updated as ultima_actualizacion
        FROM warehouse_stock ws
        JOIN products p ON ws.product_id = p.id
        JOIN storage s ON ws.branch_id = s.id
        WHERE p.id = ?
        ORDER BY s.name
        """
        stock = db.execute_query(query, (product_id,))

        return jsonify({"status": "success", "data": stock}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@inventory_router.route("/update-stock", methods=["PUT"])
def update_stock():
    """
    Actualiza el stock de un producto en una sucursal específica
    """
    try:
        data = request.get_json()
        product_id = data.get("product_id")
        storage_id = data.get("storage_id")
        quantity = data.get("quantity")

        if not all([product_id, storage_id, quantity is not None]):
            return jsonify(
                {
                    "status": "error",
                    "message": "Faltan campos requeridos: product_id, storage_id, quantity",
                }
            ), 400

        db = Database()

        # Verificar si ya existe un registro para este producto en esta sucursal
        check_query = """
        SELECT id FROM warehouse_stock 
        WHERE product_id = ? AND branch_id = ?
        """
        existing = db.execute_query(check_query, (product_id, storage_id))

        if existing:
            # Actualizar registro existente usando execute_query
            update_query = """
            UPDATE warehouse_stock 
            SET quantity = ?, last_updated = datetime('now', 'localtime')
            WHERE product_id = ? AND branch_id = ?
            """
            with db.create_connection() as conn:
                cur = conn.cursor()
                cur.execute(update_query, (quantity, product_id, storage_id))
                conn.commit()
        else:
            # Crear nuevo registro usando execute_query
            insert_query = """
            INSERT INTO warehouse_stock (product_id, branch_id, quantity, last_updated)
            VALUES (?, ?, ?, datetime('now', 'localtime'))
            """
            with db.create_connection() as conn:
                cur = conn.cursor()
                cur.execute(insert_query, (product_id, storage_id, quantity))
                conn.commit()

        return jsonify(
            {"status": "success", "message": "Stock actualizado correctamente"}
        ), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@inventory_router.route("/total-stock/<int:product_id>", methods=["GET"])
def get_total_stock(product_id):
    """
    Obtiene el stock total de un producto sumando todas las sucursales
    """
    try:
        db = Database()
        query = """
        SELECT 
            p.product_name as producto,
            SUM(ws.quantity) as stock_total,
            COUNT(ws.branch_id) as sucursales_con_stock
        FROM warehouse_stock ws
        JOIN products p ON ws.product_id = p.id
        WHERE p.id = ? AND ws.quantity > 0
        GROUP BY p.id
        """
        total_stock = db.execute_query(query, (product_id,))

        return jsonify(
            {
                "status": "success",
                "data": total_stock[0]
                if total_stock
                else {"producto": "", "stock_total": 0, "sucursales_con_stock": 0},
            }
        ), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
