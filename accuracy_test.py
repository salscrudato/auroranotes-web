#!/usr/bin/env python3
"""
AuroraNotes RAG Accuracy Test - Measures Recall, Precision, and F1 Score
Tests the RAG pipeline with a large dataset of notes and questions
"""

import requests
import time
import os
import sys
from datetime import datetime

API_URL = os.environ.get("API_URL", "https://aurora-api-884985856308.us-central1.run.app")
TEST_SECRET = os.environ.get("INTEGRATION_TEST_SECRET", "aurora-test-b7a02aa9bac703a5403e5a22441d0b47")
TEST_USER = f"accuracy-test-{os.getpid()}"

HEADERS = {
    "Content-Type": "application/json",
    "X-Test-Secret": TEST_SECRET,
    "X-Test-User-Id": TEST_USER
}

note_ids = []

def create_note(title: str, text: str) -> str:
    resp = requests.post(f"{API_URL}/_internal/test/notes", headers=HEADERS, json={"title": title, "text": text})
    return resp.json().get("id", "")

def ask_question(question: str) -> str:
    resp = requests.post(f"{API_URL}/_internal/test/chat", headers=HEADERS, json={"message": question})
    return resp.json().get("response", "")

def delete_note(note_id: str):
    requests.delete(f"{API_URL}/_internal/test/notes/{note_id}", headers=HEADERS)

def check_facts(response: str, expected_values: list) -> bool:
    response_lower = response.lower()
    return any(expected.lower() in response_lower for expected in expected_values)

NOTES = [
    ("TechCorp Q3 2024 Earnings", "TechCorp reported revenue of $847 million in Q3 2024. Net profit was $123 million. The company has 4,521 employees. CEO is Marcus Chen. Stock price closed at $156.78."),
    ("Fusion Reactor Project Alpha", "Project Alpha achieved plasma temperature of 150 million degrees Celsius. The reactor uses 47 superconducting magnets. Lead scientist is Dr. Sarah Kim. Funding is $2.3 billion over 8 years."),
    ("Drug Trial XR-7 Results", "XR-7 showed 73% efficacy in treating migraines. Trial included 1,247 participants. Side effects occurred in 12% of patients. Developed by Neurova Pharmaceuticals."),
    ("Manhattan Office Building Sale", "The Chrysler Annex sold for $312 million. Building has 42 floors and 890,000 square feet. Buyer is Blackrock Real Estate. Built in 1987."),
    ("Lakers 2024 Season Stats", "Lakers finished with 52 wins and 30 losses. LeBron averaged 25.7 points per game. Team payroll was $189 million."),
    ("Grandmother's Beef Stew Recipe", "Use 2.5 pounds of chuck roast. Add 6 medium potatoes, 4 carrots. Simmer for 3.5 hours at 325 degrees. Serves 8 people."),
    ("Tokyo Trip Planning", "Flight JL007 departs LAX at 1:35 PM. Hotel Okura costs $425 per night. Total trip budget is $8,500."),
    ("2024 Investment Portfolio Review", "Portfolio value is $1.45 million. Apple stock position is 850 shares. Annual return was 18.7%."),
    ("Aurora X1 Drone Specifications", "Aurora X1 has 45 minute flight time. Maximum speed is 72 mph. Price is $1,299."),
    ("Board Meeting December 2024", "Board approved $15 million expansion budget. New factory in Austin, Texas. Hiring 340 new employees."),
    ("Apollo 11 Mission Details", "Apollo 11 launched July 16, 1969. Neil Armstrong was commander. Moon walk lasted 2 hours 31 minutes."),
    ("Arctic Research Station Data", "Station Polar-7 recorded -67 degrees Fahrenheit in January. 127 polar bear sightings this year. Research team of 23 scientists."),
    ("Album Sales Report 2024", "Taylor Swift's album sold 3.4 million copies in first week. Spotify had 615 million monthly users."),
    ("Stanford CS Program Stats", "Stanford CS accepts 4.7% of applicants. Starting salary for graduates averages $142,000."),
    ("Electric Vehicle Comparison", "Tesla Model 3 has 358 mile range. Ford F-150 Lightning charges to 80% in 41 minutes."),
    ("Crypto Market Analysis Q4", "Bitcoin reached $73,750 all-time high. Total crypto market cap $2.8 trillion."),
    ("Hospital Performance Metrics", "Memorial Hospital has 847 beds. Average wait time ER is 47 minutes. Annual surgeries: 12,450."),
    ("SpaceX Starship Updates", "Starship height is 397 feet. First stage has 33 Raptor engines. Payload capacity to LEO is 150 tons."),
    ("Farm Yield Report 2024", "Corn yield was 178 bushels per acre. Soybean prices at $12.45 per bushel. Farm covers 2,340 acres."),
    ("Michelin Restaurant Visit", "Le Bernardin has 3 Michelin stars. Tasting menu is $225 per person. Chef Eric Ripert since 1994.")
]

TEST_CASES = [
    ("What was TechCorp's revenue in Q3 2024?", ["847 million", "847"]),
    ("How many employees does TechCorp have?", ["4,521", "4521"]),
    ("Who is the CEO of TechCorp?", ["Marcus Chen"]),
    ("What temperature did Project Alpha achieve?", ["150 million"]),
    ("How many magnets does the fusion reactor use?", ["47"]),
    ("Who is the lead scientist on Project Alpha?", ["Sarah Kim"]),
    ("What is the efficacy rate of XR-7?", ["73%", "73 percent", "73"]),
    ("How many participants were in the XR-7 trial?", ["1,247", "1247"]),
    ("Who developed XR-7?", ["Neurova"]),
    ("How much did the Chrysler Annex sell for?", ["312 million", "312"]),
    ("How many floors does the Chrysler Annex have?", ["42"]),
    ("What year was the Chrysler Annex built?", ["1987"]),
    ("How many wins did the Lakers have in 2024?", ["52"]),
    ("What was LeBron's scoring average?", ["25.7"]),
    ("How long should the beef stew simmer?", ["3.5 hours", "3.5"]),
    ("How many potatoes in grandmother's beef stew?", ["6"]),
    ("What is the flight number to Tokyo?", ["JL007"]),
    ("How much per night is Hotel Okura?", ["425", "$425"]),
    ("What is the total Tokyo trip budget?", ["8,500", "8500"]),
    ("What is the portfolio value?", ["1.45 million", "1.45"]),
    ("How many Apple shares are in the portfolio?", ["850"]),
    ("What was the annual return on the portfolio?", ["18.7%", "18.7"]),
    ("What is the flight time of the Aurora X1?", ["45 minute", "45"]),
    ("What is the maximum speed of the Aurora X1 drone?", ["72 mph", "72"]),
    ("How much does the Aurora X1 cost?", ["1,299", "1299"]),
    ("What was the approved expansion budget?", ["15 million", "15"]),
    ("Where is the new factory opening?", ["Austin"]),
    ("How many new employees are being hired?", ["340"]),
    ("When did Apollo 11 launch?", ["July 16, 1969", "July 16"]),
    ("How long was the Apollo 11 moon walk?", ["2 hours 31", "2 hours"]),
    ("What temperature was recorded at Polar-7?", ["-67"]),
    ("How many polar bears were sighted?", ["127"]),
    ("How many copies did Taylor Swift's album sell in the first week?", ["3.4 million", "3.4"]),
    ("How many monthly users does Spotify have?", ["615 million", "615"]),
    ("What is Stanford CS acceptance rate?", ["4.7%", "4.7"]),
    ("What is the starting salary for Stanford CS graduates?", ["142,000", "142000"]),
    ("What is the range of the Tesla Model 3?", ["358"]),
    ("How many Raptor engines does Starship have?", ["33"]),
    ("How many beds does Memorial Hospital have?", ["847"]),
    ("What is the ER wait time at Memorial Hospital?", ["47 minute", "47"]),
]

