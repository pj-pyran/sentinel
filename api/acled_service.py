"""ACLED API service for fetching conflict data"""
import requests
import json
from datetime import datetime, timedelta
from collections import defaultdict
from config import ACLED_EMAIL, ACLED_PASSWORD, ACLED_TOKEN_URL, ACLED_API_BASE, ACLED_CACHE_FILE
import os


class ACLEDServiceError(Exception):
    """Raised when ACLED authentication or data retrieval fails."""

    def __init__(self, message, upstream_status=None, upstream_body=None):
        super().__init__(message)
        self.upstream_status = upstream_status
        self.upstream_body = upstream_body


def _build_access_denied_message(response_text):
    message = (
        'ACLED authenticated the account but denied dataset access. '
        'This usually means the myACLED account does not have API/event-data access, '
        'required profile/consent steps are incomplete, or the account is still on the Open tier.'
    )

    if 'Access denied' in response_text:
        return (
            f'{message} ACLED documents that Open-tier accounts do not include API access, '
            'and public email domains are commonly assigned Open access by default.'
        )

    return f'{message} Upstream response: {response_text}'

class ACLEDService:
    def __init__(self):
        self.access_token = None
        self.token_expiry = None
        self.refresh_token = None
        
    def get_access_token(self):
        """Get OAuth access token from ACLED API"""
        if self.access_token and self.token_expiry and datetime.now() < self.token_expiry:
            return self.access_token
            
        if not ACLED_EMAIL or not ACLED_PASSWORD:
            raise ACLEDServiceError(
                "ACLED credentials not configured. Set ACLED_EMAIL and ACLED_PASSWORD environment variables."
            )
        
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
        data = {
            'username': ACLED_EMAIL,
            'password': ACLED_PASSWORD,
            'grant_type': 'password',
            'client_id': 'acled'
        }
        
        response = requests.post(ACLED_TOKEN_URL, headers=headers, data=data, timeout=30)
        
        if response.status_code == 200:
            token_data = response.json()
            self.access_token = token_data['access_token']
            self.refresh_token = token_data.get('refresh_token')
            # Token expires in 24 hours, set expiry 1 hour early to be safe
            self.token_expiry = datetime.now() + timedelta(seconds=token_data['expires_in'] - 3600)
            return self.access_token
        else:
            raise ACLEDServiceError(
                f"Failed to get ACLED access token: {response.status_code}",
                upstream_status=response.status_code,
                upstream_body=response.text,
            )
    
    def fetch_recent_events(self, days=90, limit=5000):
        """
        Fetch recent conflict events from ACLED
        
        Args:
            days: Number of days to look back
            limit: Maximum number of events to fetch
        
        Returns:
            List of conflict events
        """
        token = self.get_access_token()
        
        # Calculate date range
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
        
        # Build API URL with parameters
        params = {
            '_format': 'json',
            'event_date': f'{start_date}|{end_date}',
            'event_date_where': 'BETWEEN',
            'limit': limit,
            'fields': 'event_id_cnty|event_date|year|event_type|sub_event_type|country|region|location|fatalities|timestamp'
        }
        
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        response = requests.get(ACLED_API_BASE, params=params, headers=headers, timeout=60)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 200:
                return data.get('data', [])
            else:
                raise ACLEDServiceError(
                    f"ACLED API returned error: {data.get('error', 'Unknown error')}"
                )
        elif response.status_code == 403:
            raise ACLEDServiceError(
                _build_access_denied_message(response.text),
                upstream_status=response.status_code,
                upstream_body=response.text,
            )
        else:
            raise ACLEDServiceError(
                f"Failed to fetch ACLED data: {response.status_code}",
                upstream_status=response.status_code,
                upstream_body=response.text,
            )
    
    def calculate_conflict_metrics(self, events):
        """
        Calculate conflict metrics and trends by country/region
        
        Args:
            events: List of ACLED events
            
        Returns:
            List of conflict summaries with metrics
        """
        # Group events by country
        country_data = defaultdict(lambda: {
            'country': '',
            'region': '',
            'events': [],
            'total_events': 0,
            'total_fatalities': 0,
            'event_types': defaultdict(int),
            'recent_events': 0,  # Last 7 days
            'previous_events': 0,  # 7-14 days ago
            'timeline': []  # For sparkline
        })
        
        now = datetime.now()
        seven_days_ago = now - timedelta(days=7)
        fourteen_days_ago = now - timedelta(days=14)
        
        for event in events:
            country = event.get('country', 'Unknown')
            event_date_str = event.get('event_date', '')
            
            try:
                event_date = datetime.strptime(event_date_str, '%Y-%m-%d')
            except ValueError:
                continue
            
            data = country_data[country]
            data['country'] = country
            data['region'] = event.get('region', '')
            data['events'].append(event)
            data['total_events'] += 1
            data['total_fatalities'] += int(event.get('fatalities', 0))
            
            event_type = event.get('event_type', 'Unknown')
            data['event_types'][event_type] += 1
            
            # Count recent vs previous period events
            if event_date >= seven_days_ago:
                data['recent_events'] += 1
            elif event_date >= fourteen_days_ago:
                data['previous_events'] += 1
        
        # Calculate trends and prepare timeline data
        conflicts = []
        for country, data in country_data.items():
            # Calculate heat/trending score
            # Higher score = more recent activity and growth
            growth_rate = 0
            if data['previous_events'] > 0:
                growth_rate = (data['recent_events'] - data['previous_events']) / data['previous_events']
            elif data['recent_events'] > 0:
                growth_rate = 1.0  # New conflict area
            
            # Heat score combines recent activity with growth
            heat_score = data['recent_events'] * (1 + max(0, growth_rate))
            
            # Create timeline for sparkline (events per week over the period)
            timeline = self._create_timeline(data['events'])
            
            conflicts.append({
                'country': country,
                'region': data['region'],
                'total_events': data['total_events'],
                'total_fatalities': data['total_fatalities'],
                'recent_events': data['recent_events'],
                'previous_events': data['previous_events'],
                'growth_rate': round(growth_rate * 100, 1),  # As percentage
                'heat_score': round(heat_score, 2),
                'event_types': dict(data['event_types']),
                'timeline': timeline,
                'most_common_type': max(data['event_types'].items(), key=lambda x: x[1])[0] if data['event_types'] else 'None'
            })
        
        # Sort by heat score descending
        conflicts.sort(key=lambda x: x['heat_score'], reverse=True)
        
        return conflicts
    
    def _create_timeline(self, events, weeks=12):
        """
        Create weekly timeline of event counts for sparkline
        
        Args:
            events: List of events for a country
            weeks: Number of weeks to include
            
        Returns:
            List of weekly event counts
        """
        now = datetime.now()
        weekly_counts = [0] * weeks
        
        for event in events:
            event_date_str = event.get('event_date', '')
            try:
                event_date = datetime.strptime(event_date_str, '%Y-%m-%d')
                weeks_ago = (now - event_date).days // 7
                if 0 <= weeks_ago < weeks:
                    weekly_counts[weeks - 1 - weeks_ago] += 1
            except ValueError:
                continue
        
        return weekly_counts
    
    def get_conflicts_data(self, days=90, use_cache=True, cache_hours=6):
        """
        Get processed conflicts data with caching
        
        Args:
            days: Number of days to look back
            use_cache: Whether to use cached data if available
            cache_hours: How many hours cache is valid
            
        Returns:
            Dictionary with conflicts data and metadata
        """
        # Check cache
        if use_cache and os.path.exists(ACLED_CACHE_FILE):
            try:
                with open(ACLED_CACHE_FILE, 'r', encoding='utf-8') as f:
                    cached = json.load(f)
                    cache_time = datetime.fromisoformat(cached.get('updated_at', '2000-01-01'))
                    if datetime.now() - cache_time < timedelta(hours=cache_hours):
                        print("Using cached ACLED data")
                        return cached
            except (OSError, json.JSONDecodeError, ValueError) as e:
                print(f"Error reading cache: {e}")
        
        # Fetch fresh data
        print("Fetching fresh ACLED data...")
        events = self.fetch_recent_events(days=days)
        conflicts = self.calculate_conflict_metrics(events)
        
        result = {
            'conflicts': conflicts,
            'total_events': len(events),
            'updated_at': datetime.now().isoformat(),
            'period_days': days,
            'conflict_count': len(conflicts)
        }
        
        # Save to cache
        try:
            os.makedirs(os.path.dirname(ACLED_CACHE_FILE), exist_ok=True)
            with open(ACLED_CACHE_FILE, 'w', encoding='utf-8') as f:
                json.dump(result, f, indent=2)
            print(f"Cached ACLED data to {ACLED_CACHE_FILE}")
        except OSError as e:
            print(f"Error caching data: {e}")
        
        return result

# Global instance
acled_service = ACLEDService()
