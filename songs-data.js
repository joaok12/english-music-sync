// Catálogo Central de Músicas do Karaokê
const SONGS_CATALOG = {
  "viagens": {
    "id": "viagens",
    "title": "Frases de Viagem",
    "subtitle": "Aeroporto, Alfândega, Hotel e Restaurante",
    "category": "Viagem e Turismo",
    "badge": "17 Frases",
    "durationText": "3:00",
    "durationSec": 180.87,
    "audioFile": "audio.mp3",
    "icon": "✈️",
    "storageKey": "KARAOKE_SYNC_viagens",
    "lyrics": [
      {
        "id": 1,
        "start": 0.0,
        "end": 16.02,
        "pt": "Vamos aprender frases úteis para viagens",
        "pt_start": 7.0,
        "pt_end": 9.95,
        "en1": "Let's learn some useful phrases",
        "en1_start": 9.95,
        "en1_end": 13.36,
        "en2": "Ready? Let's go!",
        "en2_start": 13.36,
        "en2_end": 16.57,
        "words": [
          {
            "text": "Vamos",
            "line": "pt",
            "start": 7.0,
            "end": 7.38
          },
          {
            "text": "aprender",
            "line": "pt",
            "start": 7.38,
            "end": 7.99
          },
          {
            "text": "frases",
            "line": "pt",
            "start": 7.99,
            "end": 8.44
          },
          {
            "text": "úteis",
            "line": "pt",
            "start": 8.44,
            "end": 8.82
          },
          {
            "text": "para",
            "line": "pt",
            "start": 8.82,
            "end": 9.12
          },
          {
            "text": "viagens",
            "line": "pt",
            "start": 9.12,
            "end": 9.95
          },
          {
            "text": "Let's",
            "line": "en1",
            "start": 9.95,
            "end": 10.4
          },
          {
            "text": "learn",
            "line": "en1",
            "start": 10.4,
            "end": 10.85
          },
          {
            "text": "some",
            "line": "en1",
            "start": 10.85,
            "end": 11.3
          },
          {
            "text": "useful",
            "line": "en1",
            "start": 11.3,
            "end": 11.75
          },
          {
            "text": "phrases",
            "line": "en1",
            "start": 11.75,
            "end": 13.36
          },
          {
            "text": "Ready?",
            "line": "en2",
            "start": 13.36,
            "end": 13.81
          },
          {
            "text": "Let's",
            "line": "en2",
            "start": 13.81,
            "end": 14.26
          },
          {
            "text": "go!",
            "line": "en2",
            "start": 14.26,
            "end": 16.57
          }
        ]
      },
      {
        "id": 2,
        "start": 16.02,
        "end": 26.54,
        "pt": "Eu quero",
        "pt_start": 16.77,
        "pt_end": 20.68,
        "en1": "I want",
        "en1_start": 20.68,
        "en1_end": 24.49,
        "en2": "I want",
        "en2_start": 24.49,
        "en2_end": 27.09,
        "words": [
          {
            "text": "Eu",
            "line": "pt",
            "start": 16.77,
            "end": 17.61
          },
          {
            "text": "quero",
            "line": "pt",
            "start": 17.61,
            "end": 20.68
          },
          {
            "text": "I",
            "line": "en1",
            "start": 20.68,
            "end": 21.13
          },
          {
            "text": "want",
            "line": "en1",
            "start": 21.13,
            "end": 24.49
          },
          {
            "text": "I",
            "line": "en2",
            "start": 24.49,
            "end": 24.94
          },
          {
            "text": "want",
            "line": "en2",
            "start": 24.94,
            "end": 27.09
          }
        ]
      },
      {
        "id": 3,
        "start": 26.54,
        "end": 39.02,
        "pt": "Eu preciso de ajuda",
        "pt_start": 27.29,
        "pt_end": 32.05,
        "en1": "I need help",
        "en1_start": 32.05,
        "en1_end": 35.92,
        "en2": "I need help",
        "en2_start": 35.92,
        "en2_end": 39.57,
        "words": [
          {
            "text": "Eu",
            "line": "pt",
            "start": 27.29,
            "end": 27.79
          },
          {
            "text": "preciso",
            "line": "pt",
            "start": 27.79,
            "end": 29.71
          },
          {
            "text": "de",
            "line": "pt",
            "start": 29.71,
            "end": 30.21
          },
          {
            "text": "ajuda",
            "line": "pt",
            "start": 30.21,
            "end": 32.05
          },
          {
            "text": "I",
            "line": "en1",
            "start": 32.05,
            "end": 32.5
          },
          {
            "text": "need",
            "line": "en1",
            "start": 32.5,
            "end": 32.95
          },
          {
            "text": "help",
            "line": "en1",
            "start": 32.95,
            "end": 35.92
          },
          {
            "text": "I",
            "line": "en2",
            "start": 35.92,
            "end": 36.37
          },
          {
            "text": "need",
            "line": "en2",
            "start": 36.37,
            "end": 36.82
          },
          {
            "text": "help",
            "line": "en2",
            "start": 36.82,
            "end": 39.57
          }
        ]
      },
      {
        "id": 4,
        "start": 39.02,
        "end": 48.47,
        "pt": "Quanto custa?",
        "pt_start": 39.77,
        "pt_end": 43.78,
        "en1": "How much is it?",
        "en1_start": 43.78,
        "en1_end": 47.77,
        "en2": "How much is it?",
        "en2_start": 47.77,
        "en2_end": 50.62,
        "words": [
          {
            "text": "Quanto",
            "line": "pt",
            "start": 39.77,
            "end": 41.44
          },
          {
            "text": "custa?",
            "line": "pt",
            "start": 41.44,
            "end": 43.78
          },
          {
            "text": "How",
            "line": "en1",
            "start": 43.78,
            "end": 44.23
          },
          {
            "text": "much",
            "line": "en1",
            "start": 44.23,
            "end": 44.68
          },
          {
            "text": "is",
            "line": "en1",
            "start": 44.68,
            "end": 45.13
          },
          {
            "text": "it?",
            "line": "en1",
            "start": 45.13,
            "end": 47.77
          },
          {
            "text": "How",
            "line": "en2",
            "start": 47.77,
            "end": 48.22
          },
          {
            "text": "much",
            "line": "en2",
            "start": 48.22,
            "end": 48.67
          },
          {
            "text": "is",
            "line": "en2",
            "start": 48.67,
            "end": 49.12
          },
          {
            "text": "it?",
            "line": "en2",
            "start": 49.12,
            "end": 50.62
          }
        ]
      },
      {
        "id": 5,
        "start": 48.47,
        "end": 60.24,
        "pt": "Aqui está meu passaporte",
        "pt_start": 49.22,
        "pt_end": 53.75,
        "en1": "Here is my passport",
        "en1_start": 53.75,
        "en1_end": 56.8,
        "en2": "Here is my passport",
        "en2_start": 56.8,
        "en2_end": 60.79,
        "words": [
          {
            "text": "Aqui",
            "line": "pt",
            "start": 49.22,
            "end": 49.98
          },
          {
            "text": "está",
            "line": "pt",
            "start": 49.98,
            "end": 50.74
          },
          {
            "text": "meu",
            "line": "pt",
            "start": 50.74,
            "end": 51.5
          },
          {
            "text": "passaporte",
            "line": "pt",
            "start": 51.5,
            "end": 53.75
          },
          {
            "text": "Here",
            "line": "en1",
            "start": 53.75,
            "end": 54.2
          },
          {
            "text": "is",
            "line": "en1",
            "start": 54.2,
            "end": 54.65
          },
          {
            "text": "my",
            "line": "en1",
            "start": 54.65,
            "end": 55.1
          },
          {
            "text": "passport",
            "line": "en1",
            "start": 55.1,
            "end": 56.8
          },
          {
            "text": "Here",
            "line": "en2",
            "start": 56.8,
            "end": 57.25
          },
          {
            "text": "is",
            "line": "en2",
            "start": 57.25,
            "end": 57.7
          },
          {
            "text": "my",
            "line": "en2",
            "start": 57.7,
            "end": 58.15
          },
          {
            "text": "passport",
            "line": "en2",
            "start": 58.15,
            "end": 60.79
          }
        ]
      },
      {
        "id": 6,
        "start": 60.24,
        "end": 69.72,
        "pt": "Pode me ajudar?",
        "pt_start": 60.99,
        "pt_end": 62.57,
        "en1": "Can you help me?",
        "en1_start": 62.57,
        "en1_end": 66.28,
        "en2": "Can you help me?",
        "en2_start": 66.28,
        "en2_end": 70.27,
        "words": [
          {
            "text": "Pode",
            "line": "pt",
            "start": 60.99,
            "end": 61.43
          },
          {
            "text": "me",
            "line": "pt",
            "start": 61.43,
            "end": 61.68
          },
          {
            "text": "ajudar?",
            "line": "pt",
            "start": 61.68,
            "end": 62.57
          },
          {
            "text": "Can",
            "line": "en1",
            "start": 62.57,
            "end": 63.02
          },
          {
            "text": "you",
            "line": "en1",
            "start": 63.02,
            "end": 63.47
          },
          {
            "text": "help",
            "line": "en1",
            "start": 63.47,
            "end": 63.92
          },
          {
            "text": "me?",
            "line": "en1",
            "start": 63.92,
            "end": 66.28
          },
          {
            "text": "Can",
            "line": "en2",
            "start": 66.28,
            "end": 66.73
          },
          {
            "text": "you",
            "line": "en2",
            "start": 66.73,
            "end": 67.18
          },
          {
            "text": "help",
            "line": "en2",
            "start": 67.18,
            "end": 67.63
          },
          {
            "text": "me?",
            "line": "en2",
            "start": 67.63,
            "end": 70.27
          }
        ]
      },
      {
        "id": 7,
        "start": 69.72,
        "end": 81.92,
        "pt": "Onde fica o banheiro?",
        "pt_start": 70.47,
        "pt_end": 74.64,
        "en1": "Where is the bathroom?",
        "en1_start": 74.64,
        "en1_end": 78.92,
        "en2": "Where is the bathroom?",
        "en2_start": 78.92,
        "en2_end": 82.47,
        "words": [
          {
            "text": "Onde",
            "line": "pt",
            "start": 70.47,
            "end": 71.23
          },
          {
            "text": "fica",
            "line": "pt",
            "start": 71.23,
            "end": 71.99
          },
          {
            "text": "o",
            "line": "pt",
            "start": 71.99,
            "end": 72.41
          },
          {
            "text": "banheiro?",
            "line": "pt",
            "start": 72.41,
            "end": 74.64
          },
          {
            "text": "Where",
            "line": "en1",
            "start": 74.64,
            "end": 75.09
          },
          {
            "text": "is",
            "line": "en1",
            "start": 75.09,
            "end": 75.54
          },
          {
            "text": "the",
            "line": "en1",
            "start": 75.54,
            "end": 75.99
          },
          {
            "text": "bathroom?",
            "line": "en1",
            "start": 75.99,
            "end": 78.92
          },
          {
            "text": "Where",
            "line": "en2",
            "start": 78.92,
            "end": 79.37
          },
          {
            "text": "is",
            "line": "en2",
            "start": 79.37,
            "end": 79.82
          },
          {
            "text": "the",
            "line": "en2",
            "start": 79.82,
            "end": 80.27
          },
          {
            "text": "bathroom?",
            "line": "en2",
            "start": 80.27,
            "end": 82.47
          }
        ]
      },
      {
        "id": 8,
        "start": 81.92,
        "end": 89.61,
        "pt": "Onde é meu portão?",
        "pt_start": 82.67,
        "pt_end": 85.36,
        "en1": "Where is my gate?",
        "en1_start": 85.36,
        "en1_end": 87.04,
        "en2": "Where is my gate?",
        "en2_start": 87.04,
        "en2_end": 90.16,
        "words": [
          {
            "text": "Onde",
            "line": "pt",
            "start": 82.67,
            "end": 83.26
          },
          {
            "text": "é",
            "line": "pt",
            "start": 83.26,
            "end": 83.59
          },
          {
            "text": "meu",
            "line": "pt",
            "start": 83.59,
            "end": 84.18
          },
          {
            "text": "portão?",
            "line": "pt",
            "start": 84.18,
            "end": 85.36
          },
          {
            "text": "Where",
            "line": "en1",
            "start": 85.36,
            "end": 85.81
          },
          {
            "text": "is",
            "line": "en1",
            "start": 85.81,
            "end": 86.26
          },
          {
            "text": "my",
            "line": "en1",
            "start": 86.26,
            "end": 86.71
          },
          {
            "text": "gate?",
            "line": "en1",
            "start": 86.71,
            "end": 87.04
          },
          {
            "text": "Where",
            "line": "en2",
            "start": 87.04,
            "end": 87.49
          },
          {
            "text": "is",
            "line": "en2",
            "start": 87.49,
            "end": 87.94
          },
          {
            "text": "my",
            "line": "en2",
            "start": 87.94,
            "end": 88.39
          },
          {
            "text": "gate?",
            "line": "en2",
            "start": 88.39,
            "end": 90.16
          }
        ]
      },
      {
        "id": 9,
        "start": 89.61,
        "end": 101.39,
        "pt": "Qual é o meu assento?",
        "pt_start": 90.36,
        "pt_end": 94.74,
        "en1": "What is my seat?",
        "en1_start": 94.74,
        "en1_end": 98.65,
        "en2": "What is my seat?",
        "en2_start": 98.65,
        "en2_end": 101.94,
        "words": [
          {
            "text": "Qual",
            "line": "pt",
            "start": 90.36,
            "end": 91.08
          },
          {
            "text": "é",
            "line": "pt",
            "start": 91.08,
            "end": 91.48
          },
          {
            "text": "o",
            "line": "pt",
            "start": 91.48,
            "end": 91.88
          },
          {
            "text": "meu",
            "line": "pt",
            "start": 91.88,
            "end": 92.6
          },
          {
            "text": "assento?",
            "line": "pt",
            "start": 92.6,
            "end": 94.74
          },
          {
            "text": "What",
            "line": "en1",
            "start": 94.74,
            "end": 95.19
          },
          {
            "text": "is",
            "line": "en1",
            "start": 95.19,
            "end": 95.64
          },
          {
            "text": "my",
            "line": "en1",
            "start": 95.64,
            "end": 96.09
          },
          {
            "text": "seat?",
            "line": "en1",
            "start": 96.09,
            "end": 98.65
          },
          {
            "text": "What",
            "line": "en2",
            "start": 98.65,
            "end": 99.1
          },
          {
            "text": "is",
            "line": "en2",
            "start": 99.1,
            "end": 99.55
          },
          {
            "text": "my",
            "line": "en2",
            "start": 99.55,
            "end": 100.0
          },
          {
            "text": "seat?",
            "line": "en2",
            "start": 100.0,
            "end": 101.94
          }
        ]
      },
      {
        "id": 10,
        "start": 101.39,
        "end": 111.07,
        "pt": "Onde está a minha mala?",
        "pt_start": 102.14,
        "pt_end": 106.56,
        "en1": "Where is my bag?",
        "en1_start": 106.56,
        "en1_end": 108.45,
        "en2": "Where is my bag?",
        "en2_start": 108.45,
        "en2_end": 111.62,
        "words": [
          {
            "text": "Onde",
            "line": "pt",
            "start": 102.14,
            "end": 102.96
          },
          {
            "text": "está",
            "line": "pt",
            "start": 102.96,
            "end": 103.78
          },
          {
            "text": "a",
            "line": "pt",
            "start": 103.78,
            "end": 104.23
          },
          {
            "text": "minha",
            "line": "pt",
            "start": 104.23,
            "end": 105.41
          },
          {
            "text": "mala?",
            "line": "pt",
            "start": 105.41,
            "end": 106.56
          },
          {
            "text": "Where",
            "line": "en1",
            "start": 106.56,
            "end": 107.01
          },
          {
            "text": "is",
            "line": "en1",
            "start": 107.01,
            "end": 107.46
          },
          {
            "text": "my",
            "line": "en1",
            "start": 107.46,
            "end": 107.91
          },
          {
            "text": "bag?",
            "line": "en1",
            "start": 107.91,
            "end": 108.45
          },
          {
            "text": "Where",
            "line": "en2",
            "start": 108.45,
            "end": 108.9
          },
          {
            "text": "is",
            "line": "en2",
            "start": 108.9,
            "end": 109.35
          },
          {
            "text": "my",
            "line": "en2",
            "start": 109.35,
            "end": 109.8
          },
          {
            "text": "bag?",
            "line": "en2",
            "start": 109.8,
            "end": 111.62
          }
        ]
      },
      {
        "id": 11,
        "start": 111.07,
        "end": 122.85,
        "pt": "Aqui está meu passaporte",
        "pt_start": 111.82,
        "pt_end": 116.69,
        "en1": "Here is my passport",
        "en1_start": 116.69,
        "en1_end": 119.95,
        "en2": "Here is my passport",
        "en2_start": 119.95,
        "en2_end": 123.4,
        "words": [
          {
            "text": "Aqui",
            "line": "pt",
            "start": 111.82,
            "end": 112.64
          },
          {
            "text": "está",
            "line": "pt",
            "start": 112.64,
            "end": 113.46
          },
          {
            "text": "meu",
            "line": "pt",
            "start": 113.46,
            "end": 114.28
          },
          {
            "text": "passaporte",
            "line": "pt",
            "start": 114.28,
            "end": 116.69
          },
          {
            "text": "Here",
            "line": "en1",
            "start": 116.69,
            "end": 117.14
          },
          {
            "text": "is",
            "line": "en1",
            "start": 117.14,
            "end": 117.59
          },
          {
            "text": "my",
            "line": "en1",
            "start": 117.59,
            "end": 118.04
          },
          {
            "text": "passport",
            "line": "en1",
            "start": 118.04,
            "end": 119.95
          },
          {
            "text": "Here",
            "line": "en2",
            "start": 119.95,
            "end": 120.4
          },
          {
            "text": "is",
            "line": "en2",
            "start": 120.4,
            "end": 120.85
          },
          {
            "text": "my",
            "line": "en2",
            "start": 120.85,
            "end": 121.3
          },
          {
            "text": "passport",
            "line": "en2",
            "start": 121.3,
            "end": 123.4
          }
        ]
      },
      {
        "id": 12,
        "start": 122.85,
        "end": 132.78,
        "pt": "Pode me ajudar?",
        "pt_start": 123.6,
        "pt_end": 125.45,
        "en1": "Can you help me?",
        "en1_start": 125.45,
        "en1_end": 129.28,
        "en2": "Can you help me?",
        "en2_start": 129.28,
        "en2_end": 133.33,
        "words": [
          {
            "text": "Pode",
            "line": "pt",
            "start": 123.6,
            "end": 124.12
          },
          {
            "text": "me",
            "line": "pt",
            "start": 124.12,
            "end": 124.41
          },
          {
            "text": "ajudar?",
            "line": "pt",
            "start": 124.41,
            "end": 125.45
          },
          {
            "text": "Can",
            "line": "en1",
            "start": 125.45,
            "end": 125.9
          },
          {
            "text": "you",
            "line": "en1",
            "start": 125.9,
            "end": 126.35
          },
          {
            "text": "help",
            "line": "en1",
            "start": 126.35,
            "end": 126.8
          },
          {
            "text": "me?",
            "line": "en1",
            "start": 126.8,
            "end": 129.28
          },
          {
            "text": "Can",
            "line": "en2",
            "start": 129.28,
            "end": 129.73
          },
          {
            "text": "you",
            "line": "en2",
            "start": 129.73,
            "end": 130.18
          },
          {
            "text": "help",
            "line": "en2",
            "start": 130.18,
            "end": 130.63
          },
          {
            "text": "me?",
            "line": "en2",
            "start": 130.63,
            "end": 133.33
          }
        ]
      },
      {
        "id": 13,
        "start": 132.78,
        "end": 142.64,
        "pt": "Onde fica o banheiro?",
        "pt_start": 133.53,
        "pt_end": 137.64,
        "en1": "Where is the bathroom?",
        "en1_start": 137.64,
        "en1_end": 140.14,
        "en2": "Where is the bathroom?",
        "en2_start": 140.14,
        "en2_end": 143.19,
        "words": [
          {
            "text": "Onde",
            "line": "pt",
            "start": 133.53,
            "end": 134.28
          },
          {
            "text": "fica",
            "line": "pt",
            "start": 134.28,
            "end": 135.03
          },
          {
            "text": "o",
            "line": "pt",
            "start": 135.03,
            "end": 135.44
          },
          {
            "text": "banheiro?",
            "line": "pt",
            "start": 135.44,
            "end": 137.64
          },
          {
            "text": "Where",
            "line": "en1",
            "start": 137.64,
            "end": 138.09
          },
          {
            "text": "is",
            "line": "en1",
            "start": 138.09,
            "end": 138.54
          },
          {
            "text": "the",
            "line": "en1",
            "start": 138.54,
            "end": 138.99
          },
          {
            "text": "bathroom?",
            "line": "en1",
            "start": 138.99,
            "end": 140.14
          },
          {
            "text": "Where",
            "line": "en2",
            "start": 140.14,
            "end": 140.59
          },
          {
            "text": "is",
            "line": "en2",
            "start": 140.59,
            "end": 141.04
          },
          {
            "text": "the",
            "line": "en2",
            "start": 141.04,
            "end": 141.49
          },
          {
            "text": "bathroom?",
            "line": "en2",
            "start": 141.49,
            "end": 143.19
          }
        ]
      },
      {
        "id": 14,
        "start": 142.64,
        "end": 150.62,
        "pt": "Eu não entendo",
        "pt_start": 143.39,
        "pt_end": 147.44,
        "en1": "I don't understand",
        "en1_start": 147.44,
        "en1_end": 149.49,
        "en2": "I don't understand",
        "en2_start": 149.49,
        "en2_end": 151.17,
        "words": [
          {
            "text": "Eu",
            "line": "pt",
            "start": 143.39,
            "end": 143.89
          },
          {
            "text": "não",
            "line": "pt",
            "start": 143.89,
            "end": 144.79
          },
          {
            "text": "entendo",
            "line": "pt",
            "start": 144.79,
            "end": 147.44
          },
          {
            "text": "I",
            "line": "en1",
            "start": 147.44,
            "end": 147.89
          },
          {
            "text": "don't",
            "line": "en1",
            "start": 147.89,
            "end": 148.34
          },
          {
            "text": "understand",
            "line": "en1",
            "start": 148.34,
            "end": 149.49
          },
          {
            "text": "I",
            "line": "en2",
            "start": 149.49,
            "end": 149.94
          },
          {
            "text": "don't",
            "line": "en2",
            "start": 149.94,
            "end": 150.39
          },
          {
            "text": "understand",
            "line": "en2",
            "start": 150.39,
            "end": 151.17
          }
        ]
      },
      {
        "id": 15,
        "start": 150.62,
        "end": 159.89,
        "pt": "Pode repetir?",
        "pt_start": 151.37,
        "pt_end": 153.46,
        "en1": "Can you repeat?",
        "en1_start": 153.46,
        "en1_end": 157.19,
        "en2": "Can you repeat?",
        "en2_start": 157.19,
        "en2_end": 160.44,
        "words": [
          {
            "text": "Pode",
            "line": "pt",
            "start": 151.37,
            "end": 151.9
          },
          {
            "text": "repetir?",
            "line": "pt",
            "start": 151.9,
            "end": 153.46
          },
          {
            "text": "Can",
            "line": "en1",
            "start": 153.46,
            "end": 153.91
          },
          {
            "text": "you",
            "line": "en1",
            "start": 153.91,
            "end": 154.36
          },
          {
            "text": "repeat?",
            "line": "en1",
            "start": 154.36,
            "end": 157.19
          },
          {
            "text": "Can",
            "line": "en2",
            "start": 157.19,
            "end": 157.64
          },
          {
            "text": "you",
            "line": "en2",
            "start": 157.64,
            "end": 158.09
          },
          {
            "text": "repeat?",
            "line": "en2",
            "start": 158.09,
            "end": 160.44
          }
        ]
      },
      {
        "id": 16,
        "start": 159.89,
        "end": 170.42,
        "pt": "Mais devagar, por favor",
        "pt_start": 160.64,
        "pt_end": 165.87,
        "en1": "Slower, please",
        "en1_start": 165.87,
        "en1_end": 167.73,
        "en2": "Slower, please",
        "en2_start": 167.73,
        "en2_end": 170.97,
        "words": [
          {
            "text": "Mais",
            "line": "pt",
            "start": 160.64,
            "end": 161.49
          },
          {
            "text": "devagar,",
            "line": "pt",
            "start": 161.49,
            "end": 163.29
          },
          {
            "text": "por",
            "line": "pt",
            "start": 163.29,
            "end": 164.14
          },
          {
            "text": "favor",
            "line": "pt",
            "start": 164.14,
            "end": 165.87
          },
          {
            "text": "Slower,",
            "line": "en1",
            "start": 165.87,
            "end": 166.32
          },
          {
            "text": "please",
            "line": "en1",
            "start": 166.32,
            "end": 167.73
          },
          {
            "text": "Slower,",
            "line": "en2",
            "start": 167.73,
            "end": 168.18
          },
          {
            "text": "please",
            "line": "en2",
            "start": 168.18,
            "end": 170.97
          }
        ]
      },
      {
        "id": 17,
        "start": 170.42,
        "end": 180.87,
        "pt": "Muito bem! Até a próxima vez!",
        "pt_start": 169.5,
        "pt_end": 172.49,
        "en1": "Very good!",
        "en1_start": 172.49,
        "en1_end": 173.19,
        "en2": "See you next time!",
        "en2_start": 173.19,
        "en2_end": 177.73,
        "words": [
          {
            "text": "Muito",
            "line": "pt",
            "start": 169.5,
            "end": 170.05
          },
          {
            "text": "bem!",
            "line": "pt",
            "start": 170.05,
            "end": 170.49
          },
          {
            "text": "Até",
            "line": "pt",
            "start": 170.49,
            "end": 170.82
          },
          {
            "text": "a",
            "line": "pt",
            "start": 170.82,
            "end": 170.93
          },
          {
            "text": "próxima",
            "line": "pt",
            "start": 170.93,
            "end": 171.71
          },
          {
            "text": "vez!",
            "line": "pt",
            "start": 171.71,
            "end": 172.49
          },
          {
            "text": "Very",
            "line": "en1",
            "start": 172.49,
            "end": 172.94
          },
          {
            "text": "good!",
            "line": "en1",
            "start": 172.94,
            "end": 173.19
          },
          {
            "text": "See",
            "line": "en2",
            "start": 173.19,
            "end": 173.64
          },
          {
            "text": "you",
            "line": "en2",
            "start": 173.64,
            "end": 174.09
          },
          {
            "text": "next",
            "line": "en2",
            "start": 174.09,
            "end": 174.54
          },
          {
            "text": "time!",
            "line": "en2",
            "start": 174.54,
            "end": 177.73
          }
        ]
      }
    ]
  },
  "dia_a_dia": {
    "id": "dia_a_dia",
    "title": "Frases do Dia a Dia",
    "subtitle": "Cumprimentos, Vontades e Expressões Básicas",
    "category": "Iniciante e Cotidiano",
    "badge": "21 Frases",
    "durationText": "2:13",
    "durationSec": 132.97,
    "audioFile": "audio_dia_a_dia.mp3",
    "icon": "☀️",
    "storageKey": "KARAOKE_SYNC_dia_a_dia",
    "lyrics": [
      {
        "id": 1,
        "pt": "Bom dia",
        "pt_start": 13.92,
        "pt_end": 15.6,
        "en1": "Good morning",
        "en1_start": 15.82,
        "en1_end": 18.02,
        "en2": "Good morning",
        "en2_start": 18.14,
        "en2_end": 19.1,
        "words": [
          {
            "text": "Bom",
            "line": "pt",
            "start": 13.92,
            "end": 14.8
          },
          {
            "text": "dia",
            "line": "pt",
            "start": 14.8,
            "end": 15.6
          },
          {
            "text": "Good",
            "line": "en1",
            "start": 15.82,
            "end": 16.92
          },
          {
            "text": "morning",
            "line": "en1",
            "start": 16.92,
            "end": 18.02
          },
          {
            "text": "Good",
            "line": "en2",
            "start": 18.14,
            "end": 18.52
          },
          {
            "text": "morning",
            "line": "en2",
            "start": 18.52,
            "end": 19.1
          }
        ],
        "start": 13.62,
        "end": 19.4
      },
      {
        "id": 2,
        "pt": "Boa noite",
        "pt_start": 19.54,
        "pt_end": 20.66,
        "en1": "Good night",
        "en1_start": 20.9,
        "en1_end": 21.94,
        "en2": "Good night",
        "en2_start": 22.08,
        "en2_end": 22.92,
        "words": [
          {
            "text": "Boa",
            "line": "pt",
            "start": 19.54,
            "end": 20.24
          },
          {
            "text": "noite",
            "line": "pt",
            "start": 20.24,
            "end": 20.66
          },
          {
            "text": "Good",
            "line": "en1",
            "start": 20.9,
            "end": 21.38
          },
          {
            "text": "night",
            "line": "en1",
            "start": 21.38,
            "end": 21.94
          },
          {
            "text": "Good",
            "line": "en2",
            "start": 22.08,
            "end": 22.36
          },
          {
            "text": "night",
            "line": "en2",
            "start": 22.36,
            "end": 22.92
          }
        ],
        "start": 19.24,
        "end": 23.22
      },
      {
        "id": 3,
        "pt": "Por favor",
        "pt_start": 22.78,
        "pt_end": 24.5,
        "en1": "Please",
        "en1_start": 24.5,
        "en1_end": 25.64,
        "en2": "Please",
        "en2_start": 25.92,
        "en2_end": 26.78,
        "words": [
          {
            "text": "Por",
            "line": "pt",
            "start": 22.78,
            "end": 23.84
          },
          {
            "text": "favor",
            "line": "pt",
            "start": 23.84,
            "end": 24.5
          },
          {
            "text": "Please",
            "line": "en1",
            "start": 24.5,
            "end": 25.64
          },
          {
            "text": "Please",
            "line": "en2",
            "start": 25.92,
            "end": 26.78
          }
        ],
        "start": 22.48,
        "end": 27.08
      },
      {
        "id": 4,
        "pt": "Obrigado",
        "pt_start": 27.5,
        "pt_end": 28.86,
        "en1": "Thank you",
        "en1_start": 28.86,
        "en1_end": 29.88,
        "en2": "Thank you",
        "en2_start": 29.92,
        "en2_end": 30.92,
        "words": [
          {
            "text": "Obrigado",
            "line": "pt",
            "start": 27.5,
            "end": 28.86
          },
          {
            "text": "Thank",
            "line": "en1",
            "start": 28.86,
            "end": 29.46
          },
          {
            "text": "you",
            "line": "en1",
            "start": 29.46,
            "end": 29.88
          },
          {
            "text": "Thank",
            "line": "en2",
            "start": 29.92,
            "end": 30.44
          },
          {
            "text": "you",
            "line": "en2",
            "start": 30.44,
            "end": 30.92
          }
        ],
        "start": 27.2,
        "end": 31.22
      },
      {
        "id": 5,
        "pt": "Desculpa",
        "pt_start": 31.32,
        "pt_end": 32.74,
        "en1": "Sorry",
        "en1_start": 32.74,
        "en1_end": 33.62,
        "en2": "Sorry",
        "en2_start": 33.92,
        "en2_end": 34.64,
        "words": [
          {
            "text": "Desculpa",
            "line": "pt",
            "start": 31.32,
            "end": 32.74
          },
          {
            "text": "Sorry",
            "line": "en1",
            "start": 32.74,
            "end": 33.62
          },
          {
            "text": "Sorry",
            "line": "en2",
            "start": 33.92,
            "end": 34.64
          }
        ],
        "start": 31.02,
        "end": 34.94
      },
      {
        "id": 6,
        "pt": "Com licença",
        "pt_start": 34.64,
        "pt_end": 36.66,
        "en1": "Excuse me",
        "en1_start": 36.66,
        "en1_end": 37.7,
        "en2": "Excuse me",
        "en2_start": 37.8,
        "en2_end": 38.88,
        "words": [
          {
            "text": "Com",
            "line": "pt",
            "start": 34.64,
            "end": 35.72
          },
          {
            "text": "licença",
            "line": "pt",
            "start": 35.72,
            "end": 36.66
          },
          {
            "text": "Excuse",
            "line": "en1",
            "start": 36.66,
            "end": 37.14
          },
          {
            "text": "me",
            "line": "en1",
            "start": 37.14,
            "end": 37.7
          },
          {
            "text": "Excuse",
            "line": "en2",
            "start": 37.8,
            "end": 38.18
          },
          {
            "text": "me",
            "line": "en2",
            "start": 38.18,
            "end": 38.88
          }
        ],
        "start": 34.34,
        "end": 39.18
      },
      {
        "id": 7,
        "pt": "Tudo bem?",
        "pt_start": 38.88,
        "pt_end": 40.5,
        "en1": "Are you okay?",
        "en1_start": 40.72,
        "en1_end": 42.0,
        "en2": "Are you okay?",
        "en2_start": 43.16,
        "en2_end": 44.4,
        "words": [
          {
            "text": "Tudo",
            "line": "pt",
            "start": 38.88,
            "end": 39.72
          },
          {
            "text": "bem?",
            "line": "pt",
            "start": 39.72,
            "end": 40.5
          },
          {
            "text": "Are",
            "line": "en1",
            "start": 40.72,
            "end": 41.2
          },
          {
            "text": "you",
            "line": "en1",
            "start": 41.2,
            "end": 41.42
          },
          {
            "text": "okay?",
            "line": "en1",
            "start": 41.42,
            "end": 42.0
          },
          {
            "text": "Are",
            "line": "en2",
            "start": 43.16,
            "end": 43.48
          },
          {
            "text": "you",
            "line": "en2",
            "start": 43.48,
            "end": 43.74
          },
          {
            "text": "okay?",
            "line": "en2",
            "start": 43.74,
            "end": 44.4
          }
        ],
        "start": 38.58,
        "end": 44.7
      },
      {
        "id": 8,
        "pt": "Estou bem",
        "pt_start": 46.5,
        "pt_end": 47.92,
        "en1": "I'm fine",
        "en1_start": 47.92,
        "en1_end": 49.24,
        "en2": "I'm fine",
        "en2_start": 49.36,
        "en2_end": 50.3,
        "words": [
          {
            "text": "Estou",
            "line": "pt",
            "start": 46.5,
            "end": 47.38
          },
          {
            "text": "bem",
            "line": "pt",
            "start": 47.38,
            "end": 47.92
          },
          {
            "text": "I'm",
            "line": "en1",
            "start": 47.92,
            "end": 48.76
          },
          {
            "text": "fine",
            "line": "en1",
            "start": 48.76,
            "end": 49.24
          },
          {
            "text": "I'm",
            "line": "en2",
            "start": 49.36,
            "end": 49.74
          },
          {
            "text": "fine",
            "line": "en2",
            "start": 49.74,
            "end": 50.3
          }
        ],
        "start": 46.2,
        "end": 50.6
      },
      {
        "id": 9,
        "pt": "Eu gosto",
        "pt_start": 50.5,
        "pt_end": 51.06,
        "en1": "I like it",
        "en1_start": 51.06,
        "en1_end": 53.28,
        "en2": "I like it",
        "en2_start": 53.48,
        "en2_end": 54.44,
        "words": [
          {
            "text": "Eu",
            "line": "pt",
            "start": 50.5,
            "end": 50.76
          },
          {
            "text": "gosto",
            "line": "pt",
            "start": 50.76,
            "end": 51.06
          },
          {
            "text": "I",
            "line": "en1",
            "start": 51.06,
            "end": 51.26
          },
          {
            "text": "like",
            "line": "en1",
            "start": 51.26,
            "end": 51.74
          },
          {
            "text": "it",
            "line": "en1",
            "start": 51.74,
            "end": 53.28
          },
          {
            "text": "I",
            "line": "en2",
            "start": 53.48,
            "end": 53.66
          },
          {
            "text": "like",
            "line": "en2",
            "start": 53.66,
            "end": 53.92
          },
          {
            "text": "it",
            "line": "en2",
            "start": 53.92,
            "end": 54.44
          }
        ],
        "start": 50.2,
        "end": 54.74
      },
      {
        "id": 10,
        "pt": "Eu não gosto",
        "pt_start": 54.4,
        "pt_end": 54.94,
        "en1": "I don't like it",
        "en1_start": 54.94,
        "en1_end": 56.14,
        "en2": "I don't like it",
        "en2_start": 56.36,
        "en2_end": 58.4,
        "words": [
          {
            "text": "Eu",
            "line": "pt",
            "start": 54.4,
            "end": 54.55
          },
          {
            "text": "não",
            "line": "pt",
            "start": 54.55,
            "end": 54.75
          },
          {
            "text": "gosto",
            "line": "pt",
            "start": 54.75,
            "end": 54.94
          },
          {
            "text": "I",
            "line": "en1",
            "start": 54.94,
            "end": 55.1
          },
          {
            "text": "don't",
            "line": "en1",
            "start": 55.1,
            "end": 55.38
          },
          {
            "text": "like",
            "line": "en1",
            "start": 55.38,
            "end": 55.64
          },
          {
            "text": "it",
            "line": "en1",
            "start": 55.64,
            "end": 56.14
          },
          {
            "text": "I",
            "line": "en2",
            "start": 56.36,
            "end": 56.5
          },
          {
            "text": "don't",
            "line": "en2",
            "start": 56.5,
            "end": 57.88
          },
          {
            "text": "like",
            "line": "en2",
            "start": 57.88,
            "end": 58.06
          },
          {
            "text": "it",
            "line": "en2",
            "start": 58.06,
            "end": 58.4
          }
        ],
        "start": 54.1,
        "end": 58.7
      },
      {
        "id": 11,
        "pt": "Eu quero isso",
        "pt_start": 58.4,
        "pt_end": 60.1,
        "en1": "I want this",
        "en1_start": 60.1,
        "en1_end": 61.18,
        "en2": "I want this",
        "en2_start": 61.18,
        "en2_end": 62.22,
        "words": [
          {
            "text": "Eu",
            "line": "pt",
            "start": 58.4,
            "end": 58.98
          },
          {
            "text": "quero",
            "line": "pt",
            "start": 58.98,
            "end": 59.4
          },
          {
            "text": "isso",
            "line": "pt",
            "start": 59.4,
            "end": 60.1
          },
          {
            "text": "I",
            "line": "en1",
            "start": 60.1,
            "end": 60.44
          },
          {
            "text": "want",
            "line": "en1",
            "start": 60.44,
            "end": 60.72
          },
          {
            "text": "this",
            "line": "en1",
            "start": 60.72,
            "end": 61.18
          },
          {
            "text": "I",
            "line": "en2",
            "start": 61.18,
            "end": 61.46
          },
          {
            "text": "want",
            "line": "en2",
            "start": 61.46,
            "end": 61.74
          },
          {
            "text": "this",
            "line": "en2",
            "start": 61.74,
            "end": 62.22
          }
        ],
        "start": 58.1,
        "end": 62.52
      },
      {
        "id": 12,
        "pt": "Eu quero água",
        "pt_start": 62.2,
        "pt_end": 63.86,
        "en1": "I want water",
        "en1_start": 63.86,
        "en1_end": 64.5,
        "en2": "I want water",
        "en2_start": 64.5,
        "en2_end": 65.24,
        "words": [
          {
            "text": "Eu",
            "line": "pt",
            "start": 62.2,
            "end": 62.84
          },
          {
            "text": "quero",
            "line": "pt",
            "start": 62.84,
            "end": 63.28
          },
          {
            "text": "água",
            "line": "pt",
            "start": 63.28,
            "end": 63.86
          },
          {
            "text": "I",
            "line": "en1",
            "start": 63.86,
            "end": 64.16
          },
          {
            "text": "want",
            "line": "en1",
            "start": 64.16,
            "end": 64.38
          },
          {
            "text": "water",
            "line": "en1",
            "start": 64.38,
            "end": 64.5
          },
          {
            "text": "I",
            "line": "en2",
            "start": 64.5,
            "end": 64.78
          },
          {
            "text": "want",
            "line": "en2",
            "start": 64.78,
            "end": 65.0
          },
          {
            "text": "water",
            "line": "en2",
            "start": 65.0,
            "end": 65.24
          }
        ],
        "start": 61.9,
        "end": 65.54
      },
      {
        "id": 13,
        "pt": "Eu quero comer",
        "pt_start": 65.22,
        "pt_end": 67.36,
        "en1": "I want to eat",
        "en1_start": 67.36,
        "en1_end": 68.62,
        "en2": "I want to eat",
        "en2_start": 68.62,
        "en2_end": 69.56,
        "words": [
          {
            "text": "Eu",
            "line": "pt",
            "start": 65.22,
            "end": 65.78
          },
          {
            "text": "quero",
            "line": "pt",
            "start": 65.78,
            "end": 66.72
          },
          {
            "text": "comer",
            "line": "pt",
            "start": 66.72,
            "end": 67.36
          },
          {
            "text": "I",
            "line": "en1",
            "start": 67.36,
            "end": 67.8
          },
          {
            "text": "want",
            "line": "en1",
            "start": 67.8,
            "end": 68.1
          },
          {
            "text": "to",
            "line": "en1",
            "start": 68.1,
            "end": 68.35
          },
          {
            "text": "eat",
            "line": "en1",
            "start": 68.35,
            "end": 68.62
          },
          {
            "text": "I",
            "line": "en2",
            "start": 68.62,
            "end": 68.9
          },
          {
            "text": "want",
            "line": "en2",
            "start": 68.9,
            "end": 69.15
          },
          {
            "text": "to",
            "line": "en2",
            "start": 69.15,
            "end": 69.35
          },
          {
            "text": "eat",
            "line": "en2",
            "start": 69.35,
            "end": 69.56
          }
        ],
        "start": 64.92,
        "end": 69.86
      },
      {
        "id": 14,
        "pt": "Estou com fome",
        "pt_start": 70.13,
        "pt_end": 71.54,
        "en1": "I'm hungry",
        "en1_start": 71.54,
        "en1_end": 72.64,
        "en2": "I'm hungry",
        "en2_start": 72.64,
        "en2_end": 73.8,
        "words": [
          {
            "text": "Estou",
            "line": "pt",
            "start": 70.13,
            "end": 70.7
          },
          {
            "text": "com",
            "line": "pt",
            "start": 70.7,
            "end": 70.94
          },
          {
            "text": "fome",
            "line": "pt",
            "start": 70.94,
            "end": 71.54
          },
          {
            "text": "I'm",
            "line": "en1",
            "start": 71.54,
            "end": 72.0
          },
          {
            "text": "hungry",
            "line": "en1",
            "start": 72.0,
            "end": 72.64
          },
          {
            "text": "I'm",
            "line": "en2",
            "start": 72.64,
            "end": 73.0
          },
          {
            "text": "hungry",
            "line": "en2",
            "start": 73.0,
            "end": 73.8
          }
        ],
        "start": 69.83,
        "end": 74.1
      },
      {
        "id": 15,
        "pt": "Estou com sede",
        "pt_start": 74.05,
        "pt_end": 75.16,
        "en1": "I'm thirsty",
        "en1_start": 75.16,
        "en1_end": 76.54,
        "en2": "I'm thirsty",
        "en2_start": 76.66,
        "en2_end": 77.5,
        "words": [
          {
            "text": "Estou",
            "line": "pt",
            "start": 74.05,
            "end": 74.62
          },
          {
            "text": "com",
            "line": "pt",
            "start": 74.62,
            "end": 74.94
          },
          {
            "text": "sede",
            "line": "pt",
            "start": 74.94,
            "end": 75.16
          },
          {
            "text": "I'm",
            "line": "en1",
            "start": 75.16,
            "end": 76.1
          },
          {
            "text": "thirsty",
            "line": "en1",
            "start": 76.1,
            "end": 76.54
          },
          {
            "text": "I'm",
            "line": "en2",
            "start": 76.66,
            "end": 77.12
          },
          {
            "text": "thirsty",
            "line": "en2",
            "start": 77.12,
            "end": 77.5
          }
        ],
        "start": 73.75,
        "end": 77.8
      },
      {
        "id": 16,
        "pt": "Que horas são?",
        "pt_start": 77.62,
        "pt_end": 79.16,
        "en1": "What time is it?",
        "en1_start": 79.16,
        "en1_end": 80.74,
        "en2": "What time is it?",
        "en2_start": 80.76,
        "en2_end": 81.86,
        "words": [
          {
            "text": "Que",
            "line": "pt",
            "start": 77.62,
            "end": 78.48
          },
          {
            "text": "horas",
            "line": "pt",
            "start": 78.48,
            "end": 78.8
          },
          {
            "text": "são?",
            "line": "pt",
            "start": 78.8,
            "end": 79.16
          },
          {
            "text": "What",
            "line": "en1",
            "start": 79.16,
            "end": 79.96
          },
          {
            "text": "time",
            "line": "en1",
            "start": 79.96,
            "end": 80.34
          },
          {
            "text": "is",
            "line": "en1",
            "start": 80.34,
            "end": 80.5
          },
          {
            "text": "it?",
            "line": "en1",
            "start": 80.5,
            "end": 80.74
          },
          {
            "text": "What",
            "line": "en2",
            "start": 80.76,
            "end": 80.94
          },
          {
            "text": "time",
            "line": "en2",
            "start": 80.94,
            "end": 81.32
          },
          {
            "text": "is",
            "line": "en2",
            "start": 81.32,
            "end": 81.58
          },
          {
            "text": "it?",
            "line": "en2",
            "start": 81.58,
            "end": 81.86
          }
        ],
        "start": 77.32,
        "end": 82.16
      },
      {
        "id": 17,
        "pt": "Onde você está?",
        "pt_start": 81.96,
        "pt_end": 83.66,
        "en1": "Where are you?",
        "en1_start": 83.92,
        "en1_end": 84.8,
        "en2": "Where are you?",
        "en2_start": 84.8,
        "en2_end": 85.42,
        "words": [
          {
            "text": "Onde",
            "line": "pt",
            "start": 81.96,
            "end": 82.32
          },
          {
            "text": "você",
            "line": "pt",
            "start": 82.32,
            "end": 82.8
          },
          {
            "text": "está?",
            "line": "pt",
            "start": 82.8,
            "end": 83.66
          },
          {
            "text": "Where",
            "line": "en1",
            "start": 83.92,
            "end": 84.16
          },
          {
            "text": "are",
            "line": "en1",
            "start": 84.16,
            "end": 84.42
          },
          {
            "text": "you?",
            "line": "en1",
            "start": 84.42,
            "end": 84.8
          },
          {
            "text": "Where",
            "line": "en2",
            "start": 84.8,
            "end": 85.0
          },
          {
            "text": "are",
            "line": "en2",
            "start": 85.0,
            "end": 85.2
          },
          {
            "text": "you?",
            "line": "en2",
            "start": 85.2,
            "end": 85.42
          }
        ],
        "start": 81.66,
        "end": 85.72
      },
      {
        "id": 18,
        "pt": "Estou aqui",
        "pt_start": 85.42,
        "pt_end": 86.9,
        "en1": "I'm here",
        "en1_start": 86.92,
        "en1_end": 88.0,
        "en2": "I'm here",
        "en2_start": 88.0,
        "en2_end": 89.18,
        "words": [
          {
            "text": "Estou",
            "line": "pt",
            "start": 85.42,
            "end": 86.3
          },
          {
            "text": "aqui",
            "line": "pt",
            "start": 86.3,
            "end": 86.9
          },
          {
            "text": "I'm",
            "line": "en1",
            "start": 86.92,
            "end": 87.5
          },
          {
            "text": "here",
            "line": "en1",
            "start": 87.5,
            "end": 88.0
          },
          {
            "text": "I'm",
            "line": "en2",
            "start": 88.0,
            "end": 88.82
          },
          {
            "text": "here",
            "line": "en2",
            "start": 88.82,
            "end": 89.18
          }
        ],
        "start": 85.12,
        "end": 89.48
      },
      {
        "id": 19,
        "pt": "Vamos",
        "pt_start": 89.66,
        "pt_end": 91.06,
        "en1": "Let's go",
        "en1_start": 91.06,
        "en1_end": 92.12,
        "en2": "Let's go",
        "en2_start": 92.12,
        "en2_end": 93.4,
        "words": [
          {
            "text": "Vamos",
            "line": "pt",
            "start": 89.66,
            "end": 91.06
          },
          {
            "text": "Let's",
            "line": "en1",
            "start": 91.06,
            "end": 91.4
          },
          {
            "text": "go",
            "line": "en1",
            "start": 91.4,
            "end": 92.12
          },
          {
            "text": "Let's",
            "line": "en2",
            "start": 92.12,
            "end": 92.6
          },
          {
            "text": "go",
            "line": "en2",
            "start": 92.6,
            "end": 93.4
          }
        ],
        "start": 89.36,
        "end": 93.7
      },
      {
        "id": 20,
        "pt": "Espere",
        "pt_start": 93.42,
        "pt_end": 95.06,
        "en1": "Wait",
        "en1_start": 95.06,
        "en1_end": 96.3,
        "en2": "Wait",
        "en2_start": 96.34,
        "en2_end": 97.18,
        "words": [
          {
            "text": "Espere",
            "line": "pt",
            "start": 93.42,
            "end": 95.06
          },
          {
            "text": "Wait",
            "line": "en1",
            "start": 95.06,
            "end": 96.3
          },
          {
            "text": "Wait",
            "line": "en2",
            "start": 96.34,
            "end": 97.18
          }
        ],
        "start": 93.12,
        "end": 97.48
      },
      {
        "id": 21,
        "pt": "Tudo certo",
        "pt_start": 97.2,
        "pt_end": 98.52,
        "en1": "It's okay",
        "en1_start": 98.94,
        "en1_end": 100.24,
        "en2": "It's okay",
        "en2_start": 100.76,
        "en2_end": 102.48,
        "words": [
          {
            "text": "Tudo",
            "line": "pt",
            "start": 97.2,
            "end": 97.8
          },
          {
            "text": "certo",
            "line": "pt",
            "start": 97.8,
            "end": 98.52
          },
          {
            "text": "It's",
            "line": "en1",
            "start": 98.94,
            "end": 99.84
          },
          {
            "text": "okay",
            "line": "en1",
            "start": 99.84,
            "end": 100.24
          },
          {
            "text": "It's",
            "line": "en2",
            "start": 100.76,
            "end": 102.06
          },
          {
            "text": "okay",
            "line": "en2",
            "start": 102.06,
            "end": 102.48
          }
        ],
        "start": 96.9,
        "end": 102.78
      }
    ]
  },
  "anos_80": {
    "id": "anos_80",
    "title": "Inglês Anos 80",
    "subtitle": "Frases Curtas e Essenciais de Ação",
    "category": "Anos 80 & Ação",
    "badge": "19 Frases",
    "durationText": "1:57",
    "durationSec": 117.29,
    "audioFile": "audio_80s.mp3",
    "icon": "🎸",
    "storageKey": "KARAOKE_SYNC_anos_80",
    "lyrics": [
      {
        "id": 1,
        "pt": "Eu gosto",
        "pt_start": 14.36,
        "pt_end": 15.76,
        "en1": "I like",
        "en1_start": 15.76,
        "en1_end": 17.5,
        "en2": "I like",
        "en2_start": 17.58,
        "en2_end": 19.32,
        "words": [
          {
            "text": "Eu",
            "line": "pt",
            "start": 14.36,
            "end": 15.0
          },
          {
            "text": "gosto",
            "line": "pt",
            "start": 15.0,
            "end": 15.76
          },
          {
            "text": "I",
            "line": "en1",
            "start": 15.76,
            "end": 16.5
          },
          {
            "text": "like",
            "line": "en1",
            "start": 16.5,
            "end": 17.5
          },
          {
            "text": "I",
            "line": "en2",
            "start": 17.58,
            "end": 18.5
          },
          {
            "text": "like",
            "line": "en2",
            "start": 18.5,
            "end": 19.32
          }
        ],
        "start": 14.06,
        "end": 19.62
      },
      {
        "id": 2,
        "pt": "Eu quero",
        "pt_start": 19.82,
        "pt_end": 21.02,
        "en1": "I want",
        "en1_start": 21.02,
        "en1_end": 22.5,
        "en2": "I want",
        "en2_start": 22.96,
        "en2_end": 23.62,
        "words": [
          {
            "text": "Eu",
            "line": "pt",
            "start": 19.82,
            "end": 20.4
          },
          {
            "text": "quero",
            "line": "pt",
            "start": 20.4,
            "end": 21.02
          },
          {
            "text": "I",
            "line": "en1",
            "start": 21.02,
            "end": 21.8
          },
          {
            "text": "want",
            "line": "en1",
            "start": 21.8,
            "end": 22.5
          },
          {
            "text": "I",
            "line": "en2",
            "start": 22.96,
            "end": 23.26
          },
          {
            "text": "want",
            "line": "en2",
            "start": 23.26,
            "end": 23.62
          }
        ],
        "start": 19.52,
        "end": 23.92
      },
      {
        "id": 3,
        "pt": "Eu preciso",
        "pt_start": 24.04,
        "pt_end": 25.68,
        "en1": "I need",
        "en1_start": 25.68,
        "en1_end": 27.12,
        "en2": "I need",
        "en2_start": 27.12,
        "en2_end": 27.98,
        "words": [
          {
            "text": "Eu",
            "line": "pt",
            "start": 24.04,
            "end": 24.8
          },
          {
            "text": "preciso",
            "line": "pt",
            "start": 24.8,
            "end": 25.68
          },
          {
            "text": "I",
            "line": "en1",
            "start": 25.68,
            "end": 26.5
          },
          {
            "text": "need",
            "line": "en1",
            "start": 26.5,
            "end": 27.12
          },
          {
            "text": "I",
            "line": "en2",
            "start": 27.12,
            "end": 27.48
          },
          {
            "text": "need",
            "line": "en2",
            "start": 27.48,
            "end": 27.98
          }
        ],
        "start": 23.74,
        "end": 28.28
      },
      {
        "id": 4,
        "pt": "Eu sei",
        "pt_start": 29.12,
        "pt_end": 30.1,
        "en1": "I know",
        "en1_start": 30.1,
        "en1_end": 31.46,
        "en2": "I know",
        "en2_start": 31.46,
        "en2_end": 32.5,
        "words": [
          {
            "text": "Eu",
            "line": "pt",
            "start": 29.12,
            "end": 29.6
          },
          {
            "text": "sei",
            "line": "pt",
            "start": 29.6,
            "end": 30.1
          },
          {
            "text": "I",
            "line": "en1",
            "start": 30.1,
            "end": 30.92
          },
          {
            "text": "know",
            "line": "en1",
            "start": 30.92,
            "end": 31.46
          },
          {
            "text": "I",
            "line": "en2",
            "start": 31.46,
            "end": 31.68
          },
          {
            "text": "know",
            "line": "en2",
            "start": 31.68,
            "end": 32.5
          }
        ],
        "start": 28.82,
        "end": 32.8
      },
      {
        "id": 5,
        "pt": "Eu não sei",
        "pt_start": 33.78,
        "pt_end": 34.98,
        "en1": "I don't know",
        "en1_start": 34.98,
        "en1_end": 35.74,
        "en2": "I don't know",
        "en2_start": 35.74,
        "en2_end": 37.04,
        "words": [
          {
            "text": "Eu",
            "line": "pt",
            "start": 33.78,
            "end": 34.1
          },
          {
            "text": "não",
            "line": "pt",
            "start": 34.1,
            "end": 34.44
          },
          {
            "text": "sei",
            "line": "pt",
            "start": 34.44,
            "end": 34.98
          },
          {
            "text": "I",
            "line": "en1",
            "start": 34.98,
            "end": 35.12
          },
          {
            "text": "don't",
            "line": "en1",
            "start": 35.12,
            "end": 35.48
          },
          {
            "text": "know",
            "line": "en1",
            "start": 35.48,
            "end": 35.74
          },
          {
            "text": "I",
            "line": "en2",
            "start": 35.74,
            "end": 35.9
          },
          {
            "text": "don't",
            "line": "en2",
            "start": 35.9,
            "end": 36.46
          },
          {
            "text": "know",
            "line": "en2",
            "start": 36.46,
            "end": 37.04
          }
        ],
        "start": 33.48,
        "end": 37.34
      },
      {
        "id": 6,
        "pt": "Eu posso",
        "pt_start": 37.04,
        "pt_end": 39.16,
        "en1": "I can",
        "en1_start": 39.16,
        "en1_end": 39.94,
        "en2": "I can",
        "en2_start": 39.94,
        "en2_end": 40.86,
        "words": [
          {
            "text": "Eu",
            "line": "pt",
            "start": 37.04,
            "end": 38.4
          },
          {
            "text": "posso",
            "line": "pt",
            "start": 38.4,
            "end": 39.16
          },
          {
            "text": "I",
            "line": "en1",
            "start": 39.16,
            "end": 39.36
          },
          {
            "text": "can",
            "line": "en1",
            "start": 39.36,
            "end": 39.94
          },
          {
            "text": "I",
            "line": "en2",
            "start": 39.94,
            "end": 40.12
          },
          {
            "text": "can",
            "line": "en2",
            "start": 40.12,
            "end": 40.86
          }
        ],
        "start": 36.74,
        "end": 41.16
      },
      {
        "id": 7,
        "pt": "Eu vou",
        "pt_start": 42.0,
        "pt_end": 43.58,
        "en1": "I go",
        "en1_start": 43.58,
        "en1_end": 44.14,
        "en2": "I go",
        "en2_start": 44.14,
        "en2_end": 45.28,
        "words": [
          {
            "text": "Eu",
            "line": "pt",
            "start": 42.0,
            "end": 42.8
          },
          {
            "text": "vou",
            "line": "pt",
            "start": 42.8,
            "end": 43.58
          },
          {
            "text": "I",
            "line": "en1",
            "start": 43.58,
            "end": 43.94
          },
          {
            "text": "go",
            "line": "en1",
            "start": 43.94,
            "end": 44.14
          },
          {
            "text": "I",
            "line": "en2",
            "start": 44.14,
            "end": 44.36
          },
          {
            "text": "go",
            "line": "en2",
            "start": 44.36,
            "end": 45.28
          }
        ],
        "start": 41.7,
        "end": 45.58
      },
      {
        "id": 8,
        "pt": "Vamos",
        "pt_start": 45.28,
        "pt_end": 47.66,
        "en1": "Let's go",
        "en1_start": 47.66,
        "en1_end": 48.38,
        "en2": "Let's go",
        "en2_start": 48.38,
        "en2_end": 49.54,
        "words": [
          {
            "text": "Vamos",
            "line": "pt",
            "start": 45.28,
            "end": 47.66
          },
          {
            "text": "Let's",
            "line": "en1",
            "start": 47.66,
            "end": 47.94
          },
          {
            "text": "go",
            "line": "en1",
            "start": 47.94,
            "end": 48.38
          },
          {
            "text": "Let's",
            "line": "en2",
            "start": 48.38,
            "end": 48.76
          },
          {
            "text": "go",
            "line": "en2",
            "start": 48.76,
            "end": 49.54
          }
        ],
        "start": 44.98,
        "end": 49.84
      },
      {
        "id": 9,
        "pt": "Espere",
        "pt_start": 50.28,
        "pt_end": 52.0,
        "en1": "Wait",
        "en1_start": 52.0,
        "en1_end": 52.46,
        "en2": "Wait",
        "en2_start": 52.46,
        "en2_end": 53.46,
        "words": [
          {
            "text": "Espere",
            "line": "pt",
            "start": 50.28,
            "end": 52.0
          },
          {
            "text": "Wait",
            "line": "en1",
            "start": 52.0,
            "end": 52.46
          },
          {
            "text": "Wait",
            "line": "en2",
            "start": 52.46,
            "end": 53.46
          }
        ],
        "start": 49.98,
        "end": 53.76
      },
      {
        "id": 10,
        "pt": "Venha",
        "pt_start": 54.54,
        "pt_end": 55.86,
        "en1": "Come",
        "en1_start": 55.86,
        "en1_end": 56.84,
        "en2": "Come",
        "en2_start": 56.84,
        "en2_end": 57.54,
        "words": [
          {
            "text": "Venha",
            "line": "pt",
            "start": 54.54,
            "end": 55.86
          },
          {
            "text": "Come",
            "line": "en1",
            "start": 55.86,
            "end": 56.84
          },
          {
            "text": "Come",
            "line": "en2",
            "start": 56.84,
            "end": 57.54
          }
        ],
        "start": 54.24,
        "end": 57.84
      },
      {
        "id": 11,
        "pt": "Olhe",
        "pt_start": 58.9,
        "pt_end": 59.98,
        "en1": "Look",
        "en1_start": 59.98,
        "en1_end": 60.96,
        "en2": "Look",
        "en2_start": 60.96,
        "en2_end": 61.84,
        "words": [
          {
            "text": "Olhe",
            "line": "pt",
            "start": 58.9,
            "end": 59.98
          },
          {
            "text": "Look",
            "line": "en1",
            "start": 59.98,
            "end": 60.96
          },
          {
            "text": "Look",
            "line": "en2",
            "start": 60.96,
            "end": 61.84
          }
        ],
        "start": 58.6,
        "end": 62.14
      },
      {
        "id": 12,
        "pt": "Ajuda",
        "pt_start": 62.54,
        "pt_end": 64.38,
        "en1": "Help",
        "en1_start": 64.38,
        "en1_end": 65.14,
        "en2": "Help",
        "en2_start": 65.14,
        "en2_end": 65.68,
        "words": [
          {
            "text": "Ajuda",
            "line": "pt",
            "start": 62.54,
            "end": 64.38
          },
          {
            "text": "Help",
            "line": "en1",
            "start": 64.38,
            "end": 65.14
          },
          {
            "text": "Help",
            "line": "en2",
            "start": 65.14,
            "end": 65.68
          }
        ],
        "start": 62.24,
        "end": 65.98
      },
      {
        "id": 13,
        "pt": "Por favor",
        "pt_start": 66.42,
        "pt_end": 68.6,
        "en1": "Please",
        "en1_start": 68.6,
        "en1_end": 69.88,
        "en2": "Please",
        "en2_start": 69.88,
        "en2_end": 70.84,
        "words": [
          {
            "text": "Por",
            "line": "pt",
            "start": 66.42,
            "end": 67.46
          },
          {
            "text": "favor",
            "line": "pt",
            "start": 67.46,
            "end": 68.6
          },
          {
            "text": "Please",
            "line": "en1",
            "start": 68.6,
            "end": 69.88
          },
          {
            "text": "Please",
            "line": "en2",
            "start": 69.88,
            "end": 70.84
          }
        ],
        "start": 66.12,
        "end": 71.14
      },
      {
        "id": 14,
        "pt": "Obrigado",
        "pt_start": 70.84,
        "pt_end": 72.8,
        "en1": "Thank you",
        "en1_start": 72.8,
        "en1_end": 73.74,
        "en2": "Thank you",
        "en2_start": 73.74,
        "en2_end": 74.88,
        "words": [
          {
            "text": "Obrigado",
            "line": "pt",
            "start": 70.84,
            "end": 72.8
          },
          {
            "text": "Thank",
            "line": "en1",
            "start": 72.8,
            "end": 73.24
          },
          {
            "text": "you",
            "line": "en1",
            "start": 73.24,
            "end": 73.74
          },
          {
            "text": "Thank",
            "line": "en2",
            "start": 73.74,
            "end": 74.34
          },
          {
            "text": "you",
            "line": "en2",
            "start": 74.34,
            "end": 74.88
          }
        ],
        "start": 70.54,
        "end": 75.18
      },
      {
        "id": 15,
        "pt": "Desculpa",
        "pt_start": 75.74,
        "pt_end": 77.24,
        "en1": "Sorry",
        "en1_start": 77.24,
        "en1_end": 78.1,
        "en2": "Sorry",
        "en2_start": 78.1,
        "en2_end": 78.88,
        "words": [
          {
            "text": "Desculpa",
            "line": "pt",
            "start": 75.74,
            "end": 77.24
          },
          {
            "text": "Sorry",
            "line": "en1",
            "start": 77.24,
            "end": 78.1
          },
          {
            "text": "Sorry",
            "line": "en2",
            "start": 78.1,
            "end": 78.88
          }
        ],
        "start": 75.44,
        "end": 79.18
      },
      {
        "id": 16,
        "pt": "Sim",
        "pt_start": 79.88,
        "pt_end": 81.38,
        "en1": "Yes",
        "en1_start": 81.38,
        "en1_end": 82.48,
        "en2": "Yes",
        "en2_start": 82.48,
        "en2_end": 82.96,
        "words": [
          {
            "text": "Sim",
            "line": "pt",
            "start": 79.88,
            "end": 81.38
          },
          {
            "text": "Yes",
            "line": "en1",
            "start": 81.38,
            "end": 82.48
          },
          {
            "text": "Yes",
            "line": "en2",
            "start": 82.48,
            "end": 82.96
          }
        ],
        "start": 79.58,
        "end": 83.26
      },
      {
        "id": 17,
        "pt": "Não",
        "pt_start": 83.88,
        "pt_end": 85.68,
        "en1": "No",
        "en1_start": 85.68,
        "en1_end": 86.58,
        "en2": "No",
        "en2_start": 86.58,
        "en2_end": 87.3,
        "words": [
          {
            "text": "Não",
            "line": "pt",
            "start": 83.88,
            "end": 85.68
          },
          {
            "text": "No",
            "line": "en1",
            "start": 85.68,
            "end": 86.58
          },
          {
            "text": "No",
            "line": "en2",
            "start": 86.58,
            "end": 87.3
          }
        ],
        "start": 83.58,
        "end": 87.6
      },
      {
        "id": 18,
        "pt": "Talvez",
        "pt_start": 87.88,
        "pt_end": 89.8,
        "en1": "Maybe",
        "en1_start": 89.8,
        "en1_end": 90.86,
        "en2": "Maybe",
        "en2_start": 90.86,
        "en2_end": 91.62,
        "words": [
          {
            "text": "Talvez",
            "line": "pt",
            "start": 87.88,
            "end": 89.8
          },
          {
            "text": "Maybe",
            "line": "en1",
            "start": 89.8,
            "end": 90.86
          },
          {
            "text": "Maybe",
            "line": "en2",
            "start": 90.86,
            "end": 91.62
          }
        ],
        "start": 87.58,
        "end": 91.92
      },
      {
        "id": 19,
        "pt": "Claro",
        "pt_start": 92.88,
        "pt_end": 94.24,
        "en1": "Of course",
        "en1_start": 94.24,
        "en1_end": 94.98,
        "en2": "Of course",
        "en2_start": 95.0,
        "en2_end": 96.0,
        "words": [
          {
            "text": "Claro",
            "line": "pt",
            "start": 92.88,
            "end": 94.24
          },
          {
            "text": "Of",
            "line": "en1",
            "start": 94.24,
            "end": 94.5
          },
          {
            "text": "course",
            "line": "en1",
            "start": 94.5,
            "end": 94.98
          },
          {
            "text": "Of",
            "line": "en2",
            "start": 95.0,
            "end": 95.3
          },
          {
            "text": "course",
            "line": "en2",
            "start": 95.3,
            "end": 96.0
          }
        ],
        "start": 92.58,
        "end": 96.3
      }
    ]
  }
};

// Atalhos rápidos
const LYRICS_DATA_VIAGENS = SONGS_CATALOG.viagens.lyrics;
const LYRICS_DATA_DIA_A_DIA = SONGS_CATALOG.dia_a_dia.lyrics;
const LYRICS_DATA_ANOS_80 = SONGS_CATALOG.anos_80.lyrics;

// Default
let LYRICS_DATA = LYRICS_DATA_VIAGENS;

if (typeof window !== 'undefined') {
  window.SONGS_CATALOG = SONGS_CATALOG;
  window.LYRICS_DATA = LYRICS_DATA;
}
