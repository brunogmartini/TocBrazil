"""Read-only live Data API checks. TEST_ACCESS_TOKEN must be a professional session."""
import os
import unittest
import requests


class AccessPermissions(unittest.TestCase):
    def read(self, table, fields, authenticated=False):
        headers = {"apikey": os.environ["SUPABASE_PUBLISHABLE_KEY"]}
        if authenticated:
            headers["Authorization"] = "Bearer " + os.environ["TEST_ACCESS_TOKEN"]
        return requests.get(
            os.environ["SUPABASE_URL"] + "/rest/v1/" + table,
            headers=headers, params={"select": fields, "limit": "1"}, timeout=30,
        )

    def test_anonymous_directory_read(self):
        self.assertEqual(self.read("professionals", "id,nome").status_code, 200)

    def test_professional_availability_rules_read(self):
        self.assertEqual(self.read("availability_rules", "id", True).status_code, 200)

    def test_professional_availability_blocks_read(self):
        self.assertEqual(self.read("availability_blocks", "id", True).status_code, 200)

    def test_financial_rows_remain_private(self):
        self.assertEqual(self.read("asaas_professional_accounts", "professional_id", True).status_code, 403)

    def test_anonymous_financial_rows_remain_private(self):
        self.assertIn(self.read("asaas_professional_accounts", "professional_id").status_code, (401, 403))


if __name__ == "__main__":
    unittest.main()