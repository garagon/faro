# Country earthquake views

Country selection uses Natural Earth 1:50m country polygons, rather than a rectangular bounding box. Events on land in a different country are excluded. Offshore events within 100 km of the selected country remain visible. This is a browsing convention, not an assessment of risk, tsunami exposure, maritime jurisdiction or border disputes. Generalized borders can misclassify events near a border. Small territories absent from the dataset use the explicitly labeled approximate area fallback.

“Search this area” switches to a rectangular map search that includes neighboring countries. Switching countries restores the country filter and stops location tracking so a pending GPS result cannot move the map back to the previous destination. Local trip details remain attached to their saved destination.

Data: Natural Earth, version 5.1.2, public domain. Source: https://github.com/nvkelso/natural-earth-vector/blob/v5.1.2/geojson/ne_50m_admin_0_countries.geojson . `src/data/countryBoundaries.json` retains polygon rings, keyed by ISO_A2_EH (ISO_A2 fallback), with coordinates rounded to three decimal places. No personal or deployment data is included.

Rings are simplified with Douglas–Peucker at 0.02 degrees before rounding. Rings that would collapse below four coordinates retain the original ring. This reduces download size while preserving small islands, but is unsuitable for precise boundary decisions.
