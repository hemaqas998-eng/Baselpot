"""
Time & Market Awareness - Institutional Sessions & Killzones (Pure Python)
==========================================================================
"""

import datetime
from typing import Dict, Any, Optional

class TimeMarketAwareness:
    def __init__(self):
        pass

    def get_current_session_info(self, utc_hour: Optional[int] = None, utc_minute: Optional[int] = None) -> Dict[str, Any]:
        now = datetime.datetime.now(datetime.timezone.utc)
        h = now.hour if utc_hour is None else utc_hour
        m = now.minute if utc_minute is None else utc_minute
        time_decimal = h + m / 60.0

        is_london_kz = (7.0 <= time_decimal <= 10.0)
        is_ny_kz = (12.5 <= time_decimal <= 15.5)
        is_asia_range = (0.0 <= time_decimal <= 6.0)
        is_daily_rollover = (21.8 <= time_decimal <= 22.5)

        active_session = "OFF_HOURS"
        liquidity_multiplier = 1.0
        
        if is_ny_kz and is_london_kz:
            active_session = "LONDON_NY_OVERLAP"
            liquidity_multiplier = 1.4
        elif is_ny_kz:
            active_session = "NEW_YORK_OPEN_KILLZONE"
            liquidity_multiplier = 1.3
        elif is_london_kz:
            active_session = "LONDON_OPEN_KILLZONE"
            liquidity_multiplier = 1.25
        elif is_asia_range:
            active_session = "ASIAN_CONSOLIDATION"
            liquidity_multiplier = 0.8
        elif is_daily_rollover:
            active_session = "DAILY_ROLLOVER_SPREAD_EXPANSION"
            liquidity_multiplier = 0.4

        return {
            "utc_time": f"{h:02d}:{m:02d}",
            "active_session": active_session,
            "is_killzone": is_london_kz or is_ny_kz,
            "liquidity_multiplier": liquidity_multiplier,
            "is_tradeable_window": not is_daily_rollover
        }
