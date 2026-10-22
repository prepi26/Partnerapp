# Erzeugt das WhatsApp-Paket (1080x1920 JPG + PDF): Titel, App-Bilder, Funktionen, Fragen.
#   python3 store/whatsapp-cards.py
from PIL import Image, ImageDraw, ImageFont
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'whatsapp')
W, H = 1080, 1920
BOLD = '/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf'
SEMI = '/usr/share/fonts/opentype/inter/Inter-SemiBold.otf'
REG = '/usr/share/fonts/opentype/inter/Inter-Regular.otf'
TEAL, BLUE, ORANGE = (47, 143, 131), (79, 124, 201), (217, 137, 58)


def gradient():
    g = Image.new('RGB', (1, H))
    for y in range(H):
        t = y / H
        g.putpixel((0, y), tuple(int(TEAL[i] + (BLUE[i] - TEAL[i]) * t) for i in range(3)))
    return g.resize((W, H))


def wrap(draw, text, font, width):
    lines, line = [], ''
    for word in text.split(' '):
        test = (line + ' ' + word).strip()
        if draw.textlength(test, font=font) <= width:
            line = test
        else:
            lines.append(line)
            line = word
    lines.append(line)
    return lines


def centered(draw, y, text, font, fill='white', width=900, gap=12):
    for line in wrap(draw, text, font, width):
        w = draw.textlength(line, font=font)
        draw.text(((W - w) / 2, y), line, font=font, fill=fill)
        y += font.size + gap
    return y


def title_card():
    img = gradient()
    d = ImageDraw.Draw(img)
    icon = Image.open(os.path.join(HERE, '..', 'assets', 'icon.png')).convert('RGB').resize((300, 300))
    mask = Image.new('L', (300, 300), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, 300, 300), radius=68, fill=255)
    img.paste(icon, ((W - 300) // 2, 360), mask)
    y = centered(d, 730, 'Zwei Zuhause', ImageFont.truetype(BOLD, 110))
    y = centered(d, y + 30, 'Die App für getrennte Eltern', ImageFont.truetype(SEMI, 58))
    y = centered(d, y + 40, 'Umgang, Kosten und Absprachen fürs Kind – an einem Ort, sachlich und für beide gleich.',
                 ImageFont.truetype(REG, 46), width=860, gap=16)
    pill = ImageFont.truetype(SEMI, 40)
    text = 'Noch in Entwicklung – deine Meinung zählt'
    tw = d.textlength(text, font=pill)
    d.rounded_rectangle(((W - tw) / 2 - 40, 1600, (W + tw) / 2 + 40, 1690), radius=45, fill='white')
    d.text(((W - tw) / 2, 1622), text, font=pill, fill=TEAL)
    return img


def list_card(heading, sub, items, footer=None):
    img = gradient()
    d = ImageDraw.Draw(img)
    y = centered(d, 150, heading, ImageFont.truetype(BOLD, 84))
    if sub:
        y = centered(d, y + 10, sub, ImageFont.truetype(SEMI, 44))
    y += 50
    card_top = y
    d.rounded_rectangle((60, card_top, W - 60, H - (230 if footer else 120)), radius=48, fill='white')
    y = card_top + 60
    head_f, text_f = ImageFont.truetype(BOLD, 44), ImageFont.truetype(REG, 38)
    for emoji, title, text in items:
        d.text((110, y), emoji_fallback(emoji), font=head_f, fill=ORANGE)
        d.text((190, y), title, font=head_f, fill=(31, 45, 43))
        y += 58
        for line in wrap(d, text, text_f, W - 300):
            d.text((190, y), line, font=text_f, fill=(107, 124, 121))
            y += 48
        y += 30
    if footer:
        centered(d, H - 190, footer, ImageFont.truetype(SEMI, 40))
    return img


def emoji_fallback(e):
    # Inter kennt keine Emojis – wir nutzen schlichte Nummern/Zeichen.
    return e


def screenshot_card(name):
    shot = Image.open(os.path.join(HERE, 'screenshots', f'{name}.png')).convert('RGB')
    return shot.resize((W, int(shot.height * W / shot.width)), Image.LANCZOS).crop((0, 0, W, H))


cards = [('01-titel', title_card())]
for i, name in enumerate(['1-heute', '2-kalender', '3-kosten', '4-nachrichten', '5-entscheidungen', '6-vereinbarung']):
    cards.append((f'0{i + 2}-{name[2:]}', screenshot_card(name)))
cards.append(('08-mehr', list_card('Außerdem drin', None, [
    ('•', 'Übergaben festhalten', 'Pünktlich, verspätet, ausgefallen – der andere kann bestätigen oder widersprechen.'),
    ('•', 'Dokumente teilen', 'Zeugnisse, Arztbriefe, Bescheide – als Foto oder PDF, für beide sichtbar.'),
    ('•', 'Privates Tagebuch', 'Nur für dich. Der andere Elternteil sieht es nie.'),
    ('•', 'Jugendamt & Beratung', 'Lesezugang für Fachkräfte – nur, wenn beide zustimmen. Bericht als PDF.'),
    ('•', 'Sicher', 'Server in Deutschland/EU, keine Werbung, App-Sperre mit Face ID, Hilfe-Nummern.'),
    ('•', '11 Sprachen', 'Deutsch, Englisch, Türkisch, Arabisch, Russisch, Ukrainisch, Polnisch, Albanisch, Rumänisch, Serbisch, Französisch.'),
    ('•', 'Kostenlos', 'Alles Wichtige gratis. Nur PDF-Berichte und Belegfotos kosten etwas.'),
])))
cards.append(('09-deine-meinung', list_card('Deine Meinung?', 'Antworte einfach per WhatsApp – gern auch per Sprachnachricht.', [
    ('1', 'Würdest du das nutzen?', 'Und würde der andere Elternteil mitmachen?'),
    ('2', 'Was nervt euch am meisten?', 'Übergaben, Geld, Absprachen, Kommunikation …?'),
    ('3', 'Was fehlt dir?', 'Gibt es etwas, das unbedingt rein müsste?'),
    ('4', 'Was ist zu viel?', 'Was würdest du nie benutzen?'),
    ('5', 'Was wäre es dir wert?', 'Kostenlos ist die Basis. Für PDF-Berichte und Belege: z. B. 4–5 € im Monat?'),
], 'Danke! Deine Antworten bleiben unter uns.')))

os.makedirs(OUT, exist_ok=True)
for name, img in cards:
    img.save(os.path.join(OUT, f'{name}.jpg'), quality=85)
pages = [img for _, img in cards]
pages[0].save(os.path.join(OUT, 'Zwei-Zuhause-Vorstellung.pdf'), save_all=True, append_images=pages[1:], resolution=150)
print(len(cards), 'Bilder + PDF')
