"""Read-only authorization checks; uses the locally minted session without logging secrets."""
import json
import os
import unittest
from pathlib import Path
import requests


class AttendanceAccess(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        config = {}
        for line in Path('.env').read_text().splitlines():
            if '=' in line:
                key, value = line.split('=', 1)
                config[key] = value.strip().strip('"').strip("'")
        cls.url = config['VITE_SUPABASE_URL']
        cls.public = {'apikey': config['VITE_SUPABASE_PUBLISHABLE_KEY']}
        with open(os.path.expanduser('~/.cache/lovable-auth/session.json')) as f:
            session = json.load(f)
        cls.signed = {**cls.public, 'Authorization': 'Bearer ' + session['session']['access_token']}

    def test_anonymous_cannot_read_reports(self):
        r = requests.get(self.url + '/rest/v1/appointment_attendance_reports', headers=self.public, params={'select': 'id'}, timeout=30)
        self.assertIn(r.status_code, [401, 403])

    def test_unrelated_appointment_details_are_denied(self):
        r = requests.post(self.url + '/rest/v1/rpc/appointment_attendance_details', headers=self.signed, json={'_appointment_id': '00000000-0000-4000-8000-000000000000'}, timeout=30)
        self.assertEqual(r.status_code, 403)

    def test_anonymous_cannot_confirm(self):
        r = requests.post(self.url + '/rest/v1/rpc/appointment_attendance_confirm', headers=self.public, json={'_appointment_id': '00000000-0000-4000-8000-000000000000', '_side': 'paciente'}, timeout=30)
        self.assertIn(r.status_code, [401, 403])

    def test_participant_reads_reports_without_write_grants(self):
        r = requests.get(self.url + '/rest/v1/appointment_attendance_reports', headers=self.signed, params={'select': 'id', 'limit': '1'}, timeout=30)
        self.assertEqual(r.status_code, 200)


if __name__ == '__main__':
    unittest.main()