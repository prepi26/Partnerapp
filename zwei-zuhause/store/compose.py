# Baut App-Store-Bilder (1290x2796): Verlauf, Überschrift, Screenshot mit runden Ecken.
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import sys
W, H = 1290, 2796
FONT = '/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf'
SUB = '/usr/share/fonts/opentype/inter/Inter-SemiBold.otf'
items = [
  ('1-heute', 'Wer hat das Kind?', 'Auf einen Blick – mit nächster Übergabe.'),
  ('2-kalender', 'Wechselmodell?\nEinmal einstellen.', 'Tausch und Ferien per Vorschlag.'),
  ('3-kosten', 'Kosten fair teilen.', 'Der Saldo rechnet sich selbst.'),
  ('4-nachrichten', 'Nachrichten, die\nkeiner löschen kann.', 'Mit Zeitstempel und Prüfsumme.'),
  ('5-entscheidungen', 'Wichtiges gemeinsam\nentscheiden.', 'Schule, Gesundheit, Reisen.'),
  ('6-vereinbarung', 'Eure Elternvereinbarung.', 'Von beiden angenommen.'),
]
def gradient():
    top, bottom = (47, 143, 131), (79, 124, 201)
    g = Image.new('RGB', (1, H))
    for y in range(H):
        t = y / H
        g.putpixel((0, y), tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
    return g.resize((W, H))
bg = gradient()
for name, title, sub in items:
    img = bg.copy()
    d = ImageDraw.Draw(img)
    f, fs = ImageFont.truetype(FONT, 96), ImageFont.truetype(SUB, 54)
    y = 170
    for line in title.split('\n'):
        w = d.textlength(line, font=f)
        d.text(((W - w) / 2, y), line, font=f, fill='white')
        y += 118
    w = d.textlength(sub, font=fs)
    d.text(((W - w) / 2, y + 20), sub, font=fs, fill=(255, 255, 255, 230))
    shot = Image.open(f'{name}.png').convert('RGB')
    sw = 1010
    sh = int(shot.height * sw / shot.width)
    shot = shot.resize((sw, sh), Image.LANCZOS)
    top = y + 140
    mask = Image.new('L', (sw, sh), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, sw, sh), radius=70, fill=255)
    shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(((W - sw) // 2, top + 20, (W + sw) // 2, top + sh + 20), radius=70, fill=(0, 0, 0, 90))
    shadow = shadow.filter(ImageFilter.GaussianBlur(30))
    img = Image.alpha_composite(img.convert('RGBA'), shadow).convert('RGB')
    img.paste(shot, ((W - sw) // 2, top), mask)
    img.save(f'{sys.argv[1]}/{name}.png')
print('done')
