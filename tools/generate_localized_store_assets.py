# -*- coding: utf-8 -*-
"""
Generate localized store screenshots and promotional tiles for Chrome Web Store & Edge Add-ons.
Supports English (en), German (de), Russian (ru), and Japanese (ja).
"""
import os
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = Path(__file__).resolve().parents[1]
DIST_DIR = BASE_DIR / 'dist'

IMG_POPUP_PATH = Path(r"C:/Users/Mister Smith/.gemini/antigravity/brain/891a0243-5e3c-4022-be80-dea38f5f83bf/.user_uploaded/media_1791773573307_d55e2973.png") # allow-hardcode
IMG_MP_PATH = Path(r"C:/Users/Mister Smith/.gemini/antigravity/brain/891a0243-5e3c-4022-be80-dea38f5f83bf/.user_uploaded/media_1791773573308_4af004da.png") # allow-hardcode

FONT_SEGOE_BOLD = r"C:\Windows\Fonts\segoeuib.ttf" # allow-hardcode
FONT_SEGOE_REG = r"C:\Windows\Fonts\segoeui.ttf" # allow-hardcode
FONT_MEIRYO_BOLD = r"C:\Windows\Fonts\meiryob.ttc" # allow-hardcode
FONT_MEIRYO_REG = r"C:\Windows\Fonts\meiryo.ttc" # allow-hardcode

LOCALES_DATA = {
    'en': {
        'font_bold': FONT_SEGOE_BOLD,
        'font_reg': FONT_SEGOE_REG,
        'badge1': "SoundCloud Digging Engine",
        'title1_a': "Zero Familiar Tracks!",
        'title1_b': "Auto-Discover New Artists",
        'sub1': "Skip liked tracks & followed artists in seconds.\nPure discovery stream of 100% unplayed new talent.",
        'features1': [
            ("Pure Discovery", "Auto-skip likes, follows & disliked tracks", (255, 170, 50)),
            ("Rapid Filter", "1-click skip for tracks (Dislike) & artists (Hate)", (255, 100, 80)),
            ("1-Click Save", "Save new gems to playlists on the spot", (120, 220, 100)),
            ("Multi-Language", "EN, DE, RU, JA fully supported", (100, 190, 255)),
        ],
        'badge2': "Picture-in-Picture Always-on-Top",
        'title2_a': "Stay on Top While Working",
        'title2_b': "Floating Mini Player (PiP)",
        'sub2': "Compact player in the corner of your screen.\nControl tracks effortlessly without switching tabs.",
        'features2': [
            ("Always-on-Top", "View artwork & artist info while gaming or working", (100, 210, 255)),
            ("Full Control", "Play / Seek / Volume / Follow / Station", (255, 180, 70)),
            ("Instant Save", "Like / Repost / Add to Playlist on the spot", (255, 110, 140)),
            ("Auto-Launch", "Opens mini player automatically when switching tabs", (120, 230, 140)),
        ],
        'small_title_sub': "for SoundCloud",
        'small_sub': "Auto-Discover New Artists",
        'small_tag': "Auto-Skip Familiar Tracks & Mini Player",
        'mq_badge': "SoundCloud Discovery Tool",
        'mq_title_sub': "for SoundCloud",
        'mq_sub': "Zero familiar tracks! Continuously discover unplayed new artists",
        'mq_desc': "Auto-skip liked tracks and followed artists.\nFloating mini player (PiP) lets you dig and save music while working or gaming.",
        'mq_tags': ["Pure Discovery", "Rapid Filter", "Mini Player (PiP)", "1-Click Save", "Multi-Language"],
    },
    'de': {
        'font_bold': FONT_SEGOE_BOLD,
        'font_reg': FONT_SEGOE_REG,
        'badge1': "SoundCloud Entdeckungs-Tool",
        'title1_a': "Keine bekannten Titel!",
        'title1_b': "Neue Künstler entdecken",
        'sub1': "Überspringt gelikte Titel & Künstler, denen du folgst.\n100 % ungehörte neue Musik im Endlos-Stream.",
        'features1': [
            ("Pure Discovery", "Auto-Skip für Likes, Follows & Dislikes", (255, 170, 50)),
            ("Schnellfilter", "1-Klick-Ausschluss für Titel (Dislike) & Künstler (Hate)", (255, 100, 80)),
            ("1-Klick-Speichern", "Titel sofort zur Lieblings-Playlist hinzufügen", (120, 220, 100)),
            ("Mehrsprachig", "DE, EN, RU, JA vollständig unterstützt", (100, 190, 255)),
        ],
        'badge2': "Picture-in-Picture Immer im Vordergrund",
        'title2_a': "Immer im Blick beim Arbeiten",
        'title2_b': "Schwebender Mini-Player",
        'sub2': "Kompakter Player in der Bildschirmecke.\nBequeme Steuerung ohne lästiges Tab-Wechseln.",
        'features2': [
            ("Im Vordergrund", "Cover & Künstler während Arbeit oder Gaming im Blick", (100, 210, 255)),
            ("Volle Kontrolle", "Play / Seek / Lautstärke / Folgen / Station", (255, 180, 70)),
            ("Sofortaktionen", "Like / Repost / Playlist-Hinzufügen direkt zur Hand", (255, 110, 140)),
            ("Auto-Start", "Öffnet Mini-Player automatisch beim Tab-Wechsel", (120, 230, 140)),
        ],
        'small_title_sub': "für SoundCloud",
        'small_sub': "Neue Künstler entdecken",
        'small_tag': "Bekannte Titel überspringen & Mini-Player",
        'mq_badge': "SoundCloud Entdeckungs-Tool",
        'mq_title_sub': "für SoundCloud",
        'mq_sub': "Keine bekannten Titel! Ununterbrochen neue Talente entdecken",
        'mq_desc': "Überspringt gelikte Titel und gefolgte Künstler automatisch.\nSchwebender Mini-Player (PiP) zum Diggen beim Arbeiten & Spielen.",
        'mq_tags': ["Pure Discovery", "Schnellfilter", "Mini-Player (PiP)", "1-Klick-Save", "Mehrsprachig"],
    },
    'ru': {
        'font_bold': FONT_SEGOE_BOLD,
        'font_reg': FONT_SEGOE_REG,
        'badge1': "Поиск музыки в SoundCloud",
        'title1_a': "Ноль знакомых треков!",
        'title1_b': "Поиск новых артистов",
        'sub1': "Авто-пропуск лайков и подписок за секунду.\nБесконечный поток на 100% новой музыки.",
        'features1': [
            ("Чистый поиск", "Пропуск лайков, подписок и дизлайков", (255, 170, 50)),
            ("Быстрый фильтр", "Исключение трека (Dislike) и автора (Hate)", (255, 100, 80)),
            ("В один клик", "Мгновенно сохраняйте треки в плейлист", (120, 220, 100)),
            ("Мультиязычность", "RU, EN, DE, JA полная поддержка", (100, 190, 255)),
        ],
        'badge2': "Picture-in-Picture Поверх всех окон",
        'title2_a': "Всегда под рукой при работе",
        'title2_b': "Плавающий мини-плеер",
        'sub2': "Компактный плеер в углу вашего экрана.\nУправляйте треками без переключения вкладок.",
        'features2': [
            ("Поверх окон", "Обложка и артист перед глазами в игре или работе", (100, 210, 255)),
            ("Полный контроль", "Play / Перемотка / Громкость / Подписка / Радио", (255, 180, 70)),
            ("Быстрые действия", "Like / Repost / Добавление в плейлист на месте", (255, 110, 140)),
            ("Автозапуск", "Открытие мини-плеера при смене вкладки", (120, 230, 140)),
        ],
        'small_title_sub': "для SoundCloud",
        'small_sub': "Поиск новых артистов",
        'small_tag': "Пропуск знакомых треков и мини-плеер",
        'mq_badge': "Инструмент поиска SoundCloud",
        'mq_title_sub': "для SoundCloud",
        'mq_sub': "Ноль знакомых треков! Непрерывный поиск новых артистов",
        'mq_desc': "Автоматический пропуск лайков и подписок.\nПлавающий мини-плеер (PiP) для диггинга музыки во время работы или игр.",
        'mq_tags': ["Чистый поиск", "Быстрый фильтр", "Мини-плеер (PiP)", "В 1 клик", "Мультиязычность"],
    },
    'ja': {
        'font_bold': FONT_MEIRYO_BOLD,
        'font_reg': FONT_MEIRYO_REG,
        'badge1': "SoundCloud 発掘専用",
        'title1_a': "知っている曲ゼロ！",
        'title1_b': "新アーティスト自動発掘",
        'sub1': "Likesやフォロー中の既知曲を秒速スキップ。\n100%未試聴の新しい才能だけがエンドレスに流れます。",
        'features1': [
            ("純粋発掘", "Likes・フォロー・Dislike曲を自動スキップ", (255, 170, 50)),
            ("秒速選別", "Dislike (曲) ＆ Hate (作者) の一発除外フィルター", (255, 100, 80)),
            ("1クリック", "聴きながらお気に入りプレイリストへ即保存", (120, 220, 100)),
            ("多言語対応", "日本語・英語・ドイツ語・ロシア語 完全対応", (100, 190, 255)),
        ],
        'badge2': "Picture-in-Picture 常駐",
        'title2_a': "作業・ゲーム中も最前面",
        'title2_b': "浮遊ミニプレイヤー (PiP)",
        'sub2': "ブラウザや画面の隅にいつでもコンパクト表示。\nタブを切り替えてもシームレスに手元で操作できます。",
        'features2': [
            ("最前面常駐", "作業中もジャケット＆アーティスト名を常時確認", (100, 210, 255)),
            ("直感操作", "再生 / シーク / 音量 / フォロー / ステーション", (255, 180, 70)),
            ("即時収穫", "Like / Repost / プレイリスト追加を手元操作", (255, 110, 140)),
            ("自動起動", "別タブへ移動したら自動でミニプレイヤー起動", (120, 230, 140)),
        ],
        'small_title_sub': "for SoundCloud",
        'small_sub': "新アーティスト自動発掘",
        'small_tag': "既知曲スキップ ＆ 浮遊ミニプレイヤー",
        'mq_badge': "SoundCloud Discovery Tool",
        'mq_title_sub': "for SoundCloud",
        'mq_sub': "知っている曲ゼロ！未試聴の新アーティストだけを連続再生",
        'mq_desc': "Likesやフォロー中の既知曲を秒速スキップ。\n浮遊ミニプレイヤー(PiP)で作業中・ゲーム中も手元で発掘＆ワンクリック保存。",
        'mq_tags': ["純粋発掘", "秒速選別", "浮遊ミニプレイヤー", "1クリック保存", "4言語対応"],
    }
}

def create_gradient(width, height, color1, color2):
    base = Image.new('RGBA', (width, height), color1)
    top = Image.new('RGBA', (width, height), color2)
    mask = Image.new('L', (width, height))
    mask_data = []
    for y in range(height):
        ratio = y / float(height)
        mask_data.extend([int(ratio * 255)] * width)
    mask.putdata(mask_data)
    base.paste(top, (0, 0), mask)
    return base

def draw_rounded_card(canvas, img, x, y, radius=12, shadow_offset=(0, 15), shadow_blur=25):
    w, h = img.size
    shadow = Image.new('RGBA', (w + shadow_blur * 2, h + shadow_blur * 2), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.rounded_rectangle(
        [shadow_blur, shadow_blur, shadow_blur + w, shadow_blur + h],
        radius=radius,
        fill=(0, 0, 0, 175)
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(shadow_blur // 2))
    canvas.paste(shadow, (x - shadow_blur + shadow_offset[0], y - shadow_blur + shadow_offset[1]), shadow)
    
    mask = Image.new('L', (w, h), 0)
    mdraw = ImageDraw.Draw(mask)
    mdraw.rounded_rectangle([0, 0, w, h], radius=radius, fill=255)
    
    border = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    bdraw = ImageDraw.Draw(border)
    bdraw.rounded_rectangle([0, 0, w - 1, h - 1], radius=radius, outline=(255, 255, 255, 45), width=1)
    
    canvas.paste(img, (x, y), mask)
    canvas.paste(border, (x, y), border)

def make_screenshot_1(target_dir, loc, img_popup):
    W, H = 1280, 800
    bg = create_gradient(W, H, (20, 20, 26), (10, 10, 14))
    
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse([-80, -80, 520, 520], fill=(255, 85, 0, 40))
    glow = glow.filter(ImageFilter.GaussianBlur(80))
    bg.paste(glow, (0, 0), glow)

    draw = ImageDraw.Draw(bg)
    font_badge = ImageFont.truetype(loc['font_bold'], 15)
    font_title = ImageFont.truetype(loc['font_bold'], 38)
    font_sub = ImageFont.truetype(loc['font_reg'], 18)
    font_f_title = ImageFont.truetype(loc['font_bold'], 17)
    font_f_desc = ImageFont.truetype(loc['font_reg'], 15)

    # Tag Badge
    badge_w = int(draw.textlength(loc['badge1'], font=font_badge)) + 36
    draw.rounded_rectangle([75, 115, 75 + badge_w, 150], radius=17, fill=(255, 85, 0, 35), outline=(255, 85, 0, 180), width=1)
    draw.text((93, 122), loc['badge1'], font=font_badge, fill=(255, 136, 0))

    # Catch
    draw.text((75, 175), loc['title1_a'], font=font_title, fill=(255, 255, 255))
    draw.text((75, 228), loc['title1_b'], font=font_title, fill=(255, 85, 0))

    draw.text((75, 305), loc['sub1'], font=font_sub, fill=(185, 185, 195), spacing=8)

    # Feature List
    fy = 415
    for title, desc, color in loc['features1']:
        draw.ellipse([75, fy + 7, 83, fy + 15], fill=color)
        draw.text((98, fy), title, font=font_f_title, fill=color)
        draw.text((260, fy + 2), desc, font=font_f_desc, fill=(215, 215, 225))
        fy += 46

    # Scale Popup Image
    scale = 650.0 / img_popup.height
    new_w, new_h = int(img_popup.width * scale), int(img_popup.height * scale)
    scaled_popup = img_popup.resize((new_w, new_h), Image.Resampling.LANCZOS)
    draw_rounded_card(bg, scaled_popup, 760, 75, radius=12)

    out = target_dir / 'store_screenshot_1_features.png'
    bg.convert('RGB').save(out, quality=95)
    print(f"Saved: {out}")

def make_screenshot_2(target_dir, loc, img_mp):
    W, H = 1280, 800
    bg = create_gradient(W, H, (16, 18, 26), (8, 9, 14))

    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse([750, 40, 1350, 600], fill=(0, 180, 255, 35))
    glow = glow.filter(ImageFilter.GaussianBlur(90))
    bg.paste(glow, (0, 0), glow)

    draw = ImageDraw.Draw(bg)
    font_badge = ImageFont.truetype(loc['font_bold'], 15)
    font_title = ImageFont.truetype(loc['font_bold'], 38)
    font_sub = ImageFont.truetype(loc['font_reg'], 18)
    font_f_title = ImageFont.truetype(loc['font_bold'], 17)
    font_f_desc = ImageFont.truetype(loc['font_reg'], 15)

    # Tag Badge
    badge_w = int(draw.textlength(loc['badge2'], font=font_badge)) + 36
    draw.rounded_rectangle([75, 115, 75 + badge_w, 150], radius=17, fill=(0, 150, 255, 30), outline=(0, 180, 255, 180), width=1)
    draw.text((93, 122), loc['badge2'], font=font_badge, fill=(100, 210, 255))

    # Catch
    draw.text((75, 175), loc['title2_a'], font=font_title, fill=(255, 255, 255))
    draw.text((75, 228), loc['title2_b'], font=font_title, fill=(0, 210, 255))

    draw.text((75, 305), loc['sub2'], font=font_sub, fill=(185, 185, 195), spacing=8)

    # Feature List
    fy = 415
    for title, desc, color in loc['features2']:
        draw.ellipse([75, fy + 7, 83, fy + 15], fill=color)
        draw.text((98, fy), title, font=font_f_title, fill=color)
        draw.text((275, fy + 2), desc, font=font_f_desc, fill=(215, 215, 225))
        fy += 46

    # Scale Mini Player Image
    scale = 1.0
    new_w, new_h = int(img_mp.width * scale), int(img_mp.height * scale)
    scaled_mp = img_mp.resize((new_w, new_h), Image.Resampling.LANCZOS)
    draw_rounded_card(bg, scaled_mp, 615, 225, radius=12)

    out = target_dir / 'store_screenshot_2_miniplayer.png'
    bg.convert('RGB').save(out, quality=95)
    print(f"Saved: {out}")

def make_small_tile(target_dir, loc, img_mp):
    W, H = 440, 280
    bg = create_gradient(W, H, (26, 22, 25), (10, 10, 14))

    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse([W - 140, -40, W + 80, 180], fill=(255, 85, 0, 65))
    glow = glow.filter(ImageFilter.GaussianBlur(45))
    bg.paste(glow, (0, 0), glow)

    draw = ImageDraw.Draw(bg)
    font_title = ImageFont.truetype(loc['font_bold'], 26)
    font_title_sub = ImageFont.truetype(loc['font_reg'], 14)
    font_sub = ImageFont.truetype(loc['font_bold'], 14)
    font_tag = ImageFont.truetype(loc['font_reg'], 12)

    draw.text((24, 23), "FreshDig", font=font_title, fill=(255, 85, 0))
    tx = 24 + int(draw.textlength("FreshDig", font=font_title)) + 8
    draw.text((tx, 33), loc['small_title_sub'], font=font_title_sub, fill=(210, 210, 220))

    draw.text((24, 66), loc['small_sub'], font=font_sub, fill=(255, 255, 255))
    draw.text((24, 90), loc['small_tag'], font=font_tag, fill=(175, 175, 185))

    scale = 0.58
    new_w, new_h = int(img_mp.width * scale), int(img_mp.height * scale)
    scaled_mp = img_mp.resize((new_w, new_h), Image.Resampling.LANCZOS)
    draw_rounded_card(bg, scaled_mp, 40, 122, radius=8, shadow_blur=15)

    out = target_dir / 'store_promo_small_440x280.png'
    bg.convert('RGB').save(out, quality=95)
    print(f"Saved: {out}")

def make_marquee_tile(target_dir, loc, img_popup, img_mp):
    W, H = 1400, 560
    bg = create_gradient(W, H, (22, 22, 28), (10, 10, 14))

    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse([-50, -50, 480, 480], fill=(255, 85, 0, 45))
    gdraw.ellipse([W - 350, 80, W + 150, 580], fill=(0, 180, 255, 40))
    glow = glow.filter(ImageFilter.GaussianBlur(90))
    bg.paste(glow, (0, 0), glow)

    draw = ImageDraw.Draw(bg)
    font_badge = ImageFont.truetype(loc['font_bold'], 15)
    font_title = ImageFont.truetype(loc['font_bold'], 46)
    font_title_sub = ImageFont.truetype(loc['font_bold'], 32)
    font_sub = ImageFont.truetype(loc['font_bold'], 20)
    font_desc = ImageFont.truetype(loc['font_reg'], 16)
    font_tag_pill = ImageFont.truetype(loc['font_reg'], 13)

    # Badge
    badge_w = int(draw.textlength(loc['mq_badge'], font=font_badge)) + 36
    draw.rounded_rectangle([75, 70, 75 + badge_w, 105], radius=17, fill=(255, 85, 0, 35), outline=(255, 85, 0, 180), width=1)
    draw.text((93, 76), loc['mq_badge'], font=font_badge, fill=(255, 140, 20))

    # Titles
    draw.text((75, 125), "FreshDig", font=font_title, fill=(255, 85, 0))
    tx = 75 + int(draw.textlength("FreshDig", font=font_title)) + 14
    draw.text((tx, 137), loc['mq_title_sub'], font=font_title_sub, fill=(255, 255, 255))

    draw.text((75, 195), loc['mq_sub'], font=font_sub, fill=(235, 235, 245))
    draw.text((75, 245), loc['mq_desc'], font=font_desc, fill=(175, 175, 185), spacing=8)

    # Tags row
    tx = 75
    for tag in loc['mq_tags']:
        pill_w = int(draw.textlength(tag, font=font_tag_pill)) + 24
        draw.rounded_rectangle([tx, 335, tx + pill_w, 368], radius=6, fill=(35, 35, 42), outline=(60, 60, 75), width=1)
        draw.text((tx + 12, 342), tag, font=font_tag_pill, fill=(210, 210, 220))
        tx += pill_w + 12

    # Scale Popup & Mini Player on right side
    scale_p = 0.58
    w_p, h_p = int(img_popup.width * scale_p), int(img_popup.height * scale_p)
    scaled_p = img_popup.resize((w_p, h_p), Image.Resampling.LANCZOS)

    scale_mp = 0.95
    w_mp, h_mp = int(img_mp.width * scale_mp), int(img_mp.height * scale_mp)
    scaled_mp = img_mp.resize((w_mp, h_mp), Image.Resampling.LANCZOS)

    draw_rounded_card(bg, scaled_p, 720, 55, radius=10, shadow_blur=20)
    draw_rounded_card(bg, scaled_mp, 740, 165, radius=10, shadow_blur=25)

    out = target_dir / 'store_promo_marquee_1400x560.png'
    bg.convert('RGB').save(out, quality=95)
    print(f"Saved: {out}")

def main():
    if not IMG_POPUP_PATH.is_file() or not IMG_MP_PATH.is_file():
        print(f"[Error] Source UI images not found: {IMG_POPUP_PATH} or {IMG_MP_PATH}")
        sys.exit(1)

    img_popup = Image.open(IMG_POPUP_PATH).convert('RGBA')
    img_mp = Image.open(IMG_MP_PATH).convert('RGBA')

    for lang in ['en', 'de', 'ru', 'ja']:
        print(f"--- Generating assets for [{lang}] ---")
        loc = LOCALES_DATA[lang]
        target_dir = DIST_DIR / lang
        target_dir.mkdir(parents=True, exist_ok=True)

        make_screenshot_1(target_dir, loc, img_popup)
        make_screenshot_2(target_dir, loc, img_mp)
        make_small_tile(target_dir, loc, img_mp)
        make_marquee_tile(target_dir, loc, img_popup, img_mp)

    # Also update the root dist assets with Japanese as default
    loc_ja = LOCALES_DATA['ja']
    make_screenshot_1(DIST_DIR, loc_ja, img_popup)
    make_screenshot_2(DIST_DIR, loc_ja, img_mp)
    make_small_tile(DIST_DIR, loc_ja, img_mp)
    make_marquee_tile(DIST_DIR, loc_ja, img_popup, img_mp)
    print("All localized store assets generated successfully!")

if __name__ == '__main__':
    main()
