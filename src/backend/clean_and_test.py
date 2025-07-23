import sqlite3

print("🧹 Limpiando sesiones activas y probando login...")

try:
    conn = sqlite3.connect("database/mykonos.db")
    cursor = conn.cursor()

    # 1. Limpiar todas las sesiones activas
    print("1️⃣ Limpiando sesiones anteriores...")
    cursor.execute("UPDATE sessions SET is_active = 0 WHERE is_active = 1")
    deleted_sessions = cursor.rowcount
    print(f"   ✅ {deleted_sessions} sesiones desactivadas")

    # 2. Verificar que no hay sesiones activas
    cursor.execute("SELECT COUNT(*) FROM sessions WHERE is_active = 1")
    active_count = cursor.fetchone()[0]
    print(f"   📊 Sesiones activas restantes: {active_count}")

    conn.commit()
    conn.close()

    # 3. Probar login fresco
    print("\n2️⃣ Probando login con sesión limpia...")

    import sys
    import os

    sys.path.insert(0, os.path.dirname(__file__))
    from services.auth_service import authenticate_user, validate_session

    # Login
    login_result = authenticate_user(
        username="admin",
        password="admin123",
        storage_id=None,
        ip_address="127.0.0.1",
        user_agent="Test Clean",
    )

    if not login_result["success"]:
        print(f"   ❌ Login falló: {login_result['message']}")
    else:
        print("   ✅ Login exitoso!")
        token = login_result["session_data"]["session_token"]
        print(f"   Token: {token[:20]}...")

        # Validar inmediatamente
        print("\n3️⃣ Validando sesión inmediatamente...")
        validation = validate_session(token)

        if validation["success"]:
            print("   ✅ Validación exitosa!")
            print(f"   Usuario: {validation['session_data']['username']}")
            print(f"   Rol: {validation['session_data']['role']}")
            print(f"   Sucursal: {validation['session_data']['storage_name']}")

            # Validar por segunda vez
            print("\n4️⃣ Segunda validación...")
            validation2 = validate_session(token)

            if validation2["success"]:
                print("   ✅ Segunda validación exitosa!")
                print("\n🎉 SISTEMA FUNCIONANDO CORRECTAMENTE")
                print("=" * 50)
                print("✅ El backend está funcionando bien")
                print("🔄 El problema puede estar en el frontend")
                print("\n📝 SIGUIENTE PASO:")
                print("1. Abre el navegador Developer Tools (F12)")
                print("2. Ve a la pestaña Console")
                print("3. Intenta hacer login")
                print("4. Revisa si hay errores en la consola")
                print("5. Ve a Application > Local Storage")
                print("6. Verifica que session_token se guarde correctamente")
            else:
                print(f"   ❌ Segunda validación falló: {validation2['message']}")
        else:
            print(f"   ❌ Validación falló: {validation['message']}")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback

    traceback.print_exc()

print("\n" + "=" * 50)
print("💡 CONSEJOS ADICIONALES:")
print("- Refresca completamente el navegador (Ctrl+F5)")
print("- Verifica que el servidor backend esté corriendo en puerto 5000")
print("- Revisa la consola del navegador por errores JavaScript")
print("=" * 50)
