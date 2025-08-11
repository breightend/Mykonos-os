from database.database import Database

class BankService:
    def __init__(self):
        self.db = Database()

    def create_bank(self, name, swift_code):
        data = {"name": name, "swift_code": swift_code}
        return self.db.add_record("banks", data)

    def get_bank_by_id(self, bank_id):
        return self.db.get_record_by_id("banks", bank_id)

    def list_banks(self):
        return self.db.execute_query("SELECT * FROM banks")

    def update_bank(self, bank_id, **kwargs):
        data = {"id": bank_id, **kwargs}
        return self.db.update_record("banks", data)

    def delete_bank(self, bank_id):
        return self.db.delete_record("banks", "id = ?", (bank_id,))

    # Métodos para la tabla puente
    def add_bank_payment_method(self, bank_id, payment_method_id):
        data = {"bank_id": bank_id, "payment_method_id": payment_method_id}
        return self.db.add_record("bank_payment_methods", data)

    def list_bank_payment_methods(self):
        return self.db.execute_query("SELECT * FROM bank_payment_methods")

    def delete_bank_payment_method(self, bpm_id):
        return self.db.delete_record("bank_payment_methods", "id = ?", (bpm_id,))