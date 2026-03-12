#!/usr/bin/env python3
"""
Test script for ACLED API integration
Run this to verify your setup before using the web interface
"""

import os
import sys
from datetime import datetime

# Add api directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'api'))

def test_environment():
    """Check if environment variables are set"""
    print("1. Checking environment variables...")
    
    email = os.environ.get('ACLED_EMAIL')
    password = os.environ.get('ACLED_PASSWORD')
    
    if not email or not password:
        print("   ❌ ACLED credentials not found!")
        print("   Please set ACLED_EMAIL and ACLED_PASSWORD environment variables:")
        print("   export ACLED_EMAIL='your-email@example.com'")
        print("   export ACLED_PASSWORD='your-password'")
        return False
    
    print(f"   ✓ ACLED_EMAIL: {email}")
    print(f"   ✓ ACLED_PASSWORD: {'*' * len(password)}")
    return True

def test_imports():
    """Check if required packages are installed"""
    print("\n2. Checking required packages...")
    
    required = ['requests', 'flask', 'flask_cors']
    missing = []
    
    for package in required:
        try:
            __import__(package)
            print(f"   ✓ {package}")
        except ImportError:
            print(f"   ❌ {package} not found")
            missing.append(package)
    
    if missing:
        print(f"\n   Install missing packages with:")
        print(f"   pip install {' '.join(missing)}")
        return False
    
    return True

def test_authentication():
    """Test ACLED API authentication"""
    print("\n3. Testing ACLED API authentication...")
    
    try:
        from acled_service import ACLEDService
        service = ACLEDService()
        
        print("   Requesting access token...")
        token = service.get_access_token()
        
        if token:
            print(f"   ✓ Successfully authenticated!")
            print(f"   Token: {token[:20]}...{token[-20:]}")
            print(f"   Token expires: {service.token_expiry}")
            return True
        else:
            print("   ❌ No token received")
            return False
            
    except Exception as e:
        print(f"   ❌ Authentication failed: {str(e)}")
        return False

def test_data_fetch():
    """Test fetching sample data"""
    print("\n4. Testing data fetch (last 30 days, limit 100)...")
    
    try:
        from acled_service import ACLEDService
        service = ACLEDService()
        
        print("   Fetching events...")
        events = service.fetch_recent_events(days=30, limit=100)
        
        print(f"   ✓ Fetched {len(events)} events")
        
        if events:
            sample = events[0]
            print(f"\n   Sample event:")
            print(f"   - Country: {sample.get('country')}")
            print(f"   - Date: {sample.get('event_date')}")
            print(f"   - Type: {sample.get('event_type')}")
            print(f"   - Location: {sample.get('location')}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Data fetch failed: {str(e)}")
        return False

def test_processing():
    """Test data processing and metrics calculation"""
    print("\n5. Testing data processing...")
    
    try:
        from acled_service import ACLEDService
        service = ACLEDService()
        
        print("   Fetching and processing data...")
        result = service.get_conflicts_data(days=30, use_cache=False)
        
        conflicts = result.get('conflicts', [])
        print(f"   ✓ Processed {len(conflicts)} conflict areas")
        print(f"   Total events: {result.get('total_events')}")
        print(f"   Updated: {result.get('updated_at')}")
        
        if conflicts:
            top = conflicts[0]
            print(f"\n   Top conflict by heat score:")
            print(f"   - Country: {top['country']}")
            print(f"   - Region: {top['region']}")
            print(f"   - Heat Score: {top['heat_score']}")
            print(f"   - Recent Events: {top['recent_events']}")
            print(f"   - Growth Rate: {top['growth_rate']}%")
            print(f"   - Timeline: {top['timeline']}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Processing failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("ACLED Integration Test Suite")
    print("=" * 60)
    
    results = []
    
    # Run tests
    results.append(("Environment", test_environment()))
    
    if not results[-1][1]:
        print("\n⚠️  Cannot proceed without environment variables")
        sys.exit(1)
    
    results.append(("Imports", test_imports()))
    
    if not results[-1][1]:
        print("\n⚠️  Cannot proceed without required packages")
        sys.exit(1)
    
    results.append(("Authentication", test_authentication()))
    
    if not results[-1][1]:
        print("\n⚠️  Authentication failed, check credentials")
        sys.exit(1)
    
    results.append(("Data Fetch", test_data_fetch()))
    results.append(("Processing", test_processing()))
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    for test_name, passed in results:
        status = "✓ PASS" if passed else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    all_passed = all(passed for _, passed in results)
    
    if all_passed:
        print("\n🎉 All tests passed! Your ACLED integration is ready to use.")
        print("\nNext steps:")
        print("1. Start the Flask API: python api/app.py")
        print("2. Open index.html in your browser")
        print("3. Navigate to the Analytics tab")
    else:
        print("\n⚠️  Some tests failed. Please fix the issues above.")
        sys.exit(1)

if __name__ == '__main__':
    main()
