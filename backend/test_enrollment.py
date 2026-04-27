import requests
import json
from datetime import datetime, timedelta

# Configuration
API_BASE = 'http://localhost:8000/api'
USERNAME = 'test4'
PASSWORD = 'test1234'

# ============= STEP 1: LOGIN & GET TOKEN =============
def test_login():
    """Login and get access token"""
    print("🔐 Step 1: Logging in...")
    
    response = requests.post(
        f'{API_BASE}/login/',
        json={
            'username': USERNAME,
            'password': PASSWORD
        }
    )
    
    if response.status_code != 200:
        print(f"❌ Login failed: {response.status_code}")
        print(response.json())
        return None
    
    data = response.json()
    token = data.get('access')
    print(f"✅ Login successful! Token: {token[:20]}...")
    return token


# ============= STEP 2: FETCH EVENTS =============
def get_events(token):
    """Get available events"""
    print("\n📥 Step 2: Fetching events...")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    response = requests.get(
        f'{API_BASE}/events/list/',
        headers=headers
    )
    
    if response.status_code != 200:
        print(f"❌ Failed to fetch events: {response.status_code}")
        return None
    
    events = response.json()
    if not events:
        print("❌ No events found!")
        return None
    
    print(f"✅ Found {len(events)} events")
    event = events[0]
    print(f"   - Event ID: {event['id']}")
    print(f"   - Event Name: {event['name']}")
    print(f"   - Can Enroll: {event.get('can_enroll_status', {}).get('can_enroll')}")
    
    return event


# ============= STEP 3: CREATE TEAM ENROLLMENT =============
def test_enrollment(token, event_id):
    """Test team enrollment with file uploads"""
    print(f"\n📤 Step 3: Enrolling team in event {event_id}...")
    
    headers = {
        'Authorization': f'Bearer {token}',
    }
    
    # Create test files in memory
    today = datetime.now()
    dob = (today - timedelta(days=365*16)).strftime('%Y-%m-%d')  # 16 years old
    
    # Prepare players data
    players_data = []
    for i in range(8):
        # Create dummy image file
        image_content = b'\x89PNG\r\n\x1a\n' + b'\x00' * 100  # Minimal PNG
        
        # Create dummy PDF file
        pdf_content = b'%PDF-1.4\n' + b'test' * 25  # Minimal PDF
        
        players_data.append({
            'player_name': f'Player {i+1}',
            'age': 16 + i,
            'position': ['PG', 'SG', 'SF', 'PF', 'C'][i % 5],
            'dob': dob,
            'player_photo': ('photo.png', image_content, 'image/png'),
            'id_proof': ('id.pdf', pdf_content, 'application/pdf'),
        })
    
    # Prepare form data
    files = []
    data = {
        'team_name': 'Test Team API',
        'gender': 'Boys',
        'coach_name': 'Test Coach',
        'contact_number': '9841234567',
        'email': 'coach@test.com',
        'event': event_id,
    }
    
    # Add players to files/data
    for idx, player in enumerate(players_data):
        files.append(('players', (None, json.dumps({
            'player_name': player['player_name'],
            'age': player['age'],
            'position': player['position'],
            'dob': player['dob'],
        }))))
        files.append((f'players[{idx}][player_photo]', player['player_photo']))
        files.append((f'players[{idx}][id_proof]', player['id_proof']))
    
    # For multipart, we need to use requests differently
    response = requests.post(
        f'{API_BASE}/enroll/teams/',
        headers=headers,
        data=data,
        files=files
    )
    
    print(f"\nResponse Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code in [200, 201]:
        print("✅ Enrollment successful!")
        return response.json()
    else:
        print("❌ Enrollment failed!")
        return None


# ============= STEP 4: CHECK ENROLLMENT =============
def check_enrollment(token):
    """Check enrolled teams"""
    print("\n✅ Step 4: Checking enrollments...")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    response = requests.get(
        f'{API_BASE}/enroll/teams/',
        headers=headers
    )
    
    if response.status_code != 200:
        print(f"❌ Failed to fetch enrollments: {response.status_code}")
        return None
    
    teams = response.json()
    if isinstance(teams, dict) and 'results' in teams:
        teams = teams['results']
    
    print(f"✅ Found {len(teams)} enrolled teams")
    for team in teams:
        print(f"   - Team: {team['team_name']}")
        print(f"   - Players: {len(team.get('players', []))}")
        print(f"   - Event: {team.get('event_details', {}).get('name')}")
    
    return teams


# ============= MAIN TEST FUNCTION =============
def run_tests():
    """Run complete enrollment test"""
    print("=" * 50)
    print("🏀 TEAM ENROLLMENT API TEST")
    print("=" * 50)
    
    # Step 1: Login
    token = test_login()
    if not token:
        return
    
    # Step 2: Get Events
    event = get_events(token)
    if not event:
        print("\n⚠️ Creating test event first...")
        print("Please create an event in Django admin and try again")
        return
    
    # Step 3: Enroll Team
    enrollment = test_enrollment(token, event['id'])
    if not enrollment:
        return
    
    # Step 4: Check Enrollment
    teams = check_enrollment(token)
    
    print("\n" + "=" * 50)
    print("✅ TEST COMPLETED!")
    print("=" * 50)


if __name__ == '__main__':
    run_tests()