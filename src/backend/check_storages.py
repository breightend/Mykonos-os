#!/usr/bin/env python3

from database.database import Database


def main():
    db = Database()
    print("=== VERIFICACIÓN DE SUCURSALES ===")

    # Verificar todas las sucursales
    sucursales = db.get_all_records("storage")
    print(f"Total de sucursales en BD: {len(sucursales) if sucursales else 0}")

    if sucursales:
        for s in sucursales:
            print(
                f"ID: {s.get('id')}, Nombre: {s.get('name')}, Status: {s.get('status')}"
            )
    else:
        print("No hay sucursales en la base de datos")

    print()
    print("=== VERIFICACIÓN QUERY ESPECÍFICA ===")

    # Verificar la query específica que usa el auth
    available_storages = db.get_all_records_by_clause("storage", "status = ?", "Activo")
    print(
        f'Sucursales con status "Activo": {len(available_storages) if available_storages else 0}'
    )

    if available_storages:
        for s in available_storages:
            print(
                f"ID: {s.get('id')}, Nombre: {s.get('name')}, Status: {s.get('status')}"
            )

    print()
    print("=== VERIFICACIÓN TODOS LOS STATUS ===")

    # Verificar todos los valores de status únicos
    result = db.execute_query("SELECT DISTINCT status FROM storage")
    print(f"Valores únicos de status: {result}")

    print()
    print("=== VERIFICACIÓN CON ACTIVE ===")

    # Verificar también con "Active" en lugar de "Activo"
    available_storages_active = db.get_all_records_by_clause(
        "storage", "status = ?", "Active"
    )
    print(
        f'Sucursales con status "Active": {len(available_storages_active) if available_storages_active else 0}'
    )

    if available_storages_active:
        for s in available_storages_active:
            print(
                f"ID: {s.get('id')}, Nombre: {s.get('name')}, Status: {s.get('status')}"
            )


if __name__ == "__main__":
    main()
