from database.database import Database

db = Database()

try:
    print("🔍 Verificando estructura de inventory_movements_groups...")

    # Verificar si la tabla existe
    result = db.execute_query(
        "SELECT COUNT(*) as total FROM inventory_movements_groups"
    )
    print(
        f"📊 Total registros en inventory_movements_groups: {result[0]['total'] if result else 0}"
    )

    # Mostrar algunos registros si existen
    if result and result[0]["total"] > 0:
        records = db.execute_query("""
            SELECT id, origin_branch_id, destination_branch_id, status, created_at 
            FROM inventory_movements_groups 
            ORDER BY created_at DESC LIMIT 5
        """)
        print("\n📋 Últimos registros:")
        for r in records:
            print(
                f"  ID: {r['id']}, Origen: {r['origin_branch_id']}, Destino: {r['destination_branch_id']}, Estado: {r['status']}"
            )

    # Verificar sucursales
    storages = db.execute_query("SELECT id, name FROM storage ORDER BY id")
    print(f"\n🏪 Sucursales disponibles:")
    for s in storages:
        print(f"  ID: {s['id']}, Nombre: {s['name']}")

    # Simular consulta de pending-shipments para sucursal 1
    print(f"\n🔍 Simulando consulta de envíos pendientes para sucursal 1...")
    pending_query = """
    SELECT 
        img.id,
        so.name as from_storage,
        sd.name as to_storage,
        img.status,
        img.created_at
    FROM inventory_movements_groups img
    JOIN storage so ON img.origin_branch_id = so.id
    JOIN storage sd ON img.destination_branch_id = sd.id
    WHERE img.destination_branch_id = %s 
    AND img.status IN ('empacado', 'en_transito')
    ORDER BY img.created_at DESC
    """

    pending_shipments = db.execute_query(pending_query, (1,))
    print(
        f"📦 Envíos pendientes para sucursal 1: {len(pending_shipments) if pending_shipments else 0}"
    )

    if pending_shipments:
        for ship in pending_shipments:
            print(
                f"  - ID: {ship['id']}, De: {ship['from_storage']}, Estado: {ship['status']}"
            )

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback

    traceback.print_exc()
