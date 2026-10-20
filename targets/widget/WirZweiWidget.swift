import SwiftUI
import WidgetKit

// Muss mit app.json (ios.entitlements) und src/lib/widget.ts übereinstimmen.
let appGroup = "group.de.wirzwei.app"

let pink = Color(red: 1.0, green: 0.373, blue: 0.635)
let purple = Color(red: 0.773, green: 0.545, blue: 0.949)
let blue = Color(red: 0.22, green: 0.784, blue: 0.949)

/// Was die App über ExtensionStorage in die App Group schreibt.
struct CoupleData {
  var myName = ""
  var partnerName = ""
  var nameA = ""
  var nameB = ""
  var start: Date?
  var status = "together"
  var wedding: Date?

  static func load() -> CoupleData {
    let defaults = UserDefaults(suiteName: appGroup)
    func text(_ key: String) -> String { defaults?.string(forKey: key) ?? "" }
    return CoupleData(
      myName: text("myName"),
      partnerName: text("partnerName"),
      nameA: text("nameA"),
      nameB: text("nameB"),
      start: parseDay(text("startDate")),
      status: text("status").isEmpty ? "together" : text("status"),
      wedding: parseDay(text("weddingDate"))
    )
  }

  static var sample: CoupleData {
    CoupleData(
      myName: "Lena", partnerName: "Max", nameA: "Lena", nameB: "Max",
      start: Calendar.current.date(byAdding: .day, value: -523, to: Date()))
  }
}

func parseDay(_ value: String) -> Date? {
  guard !value.isEmpty else { return nil }
  let formatter = DateFormatter()
  formatter.calendar = Calendar(identifier: .gregorian)
  formatter.locale = Locale(identifier: "en_US_POSIX")
  formatter.timeZone = .current
  formatter.dateFormat = "yyyy-MM-dd"
  return formatter.date(from: value)
}

func daysBetween(_ from: Date, _ to: Date) -> Int {
  let calendar = Calendar.current
  return calendar.dateComponents([.day], from: calendar.startOfDay(for: from), to: calendar.startOfDay(for: to)).day ?? 0
}

func formatNumber(_ value: Int) -> String {
  value.formatted(.number.locale(Locale(identifier: "de_DE")))
}

func formatDay(_ date: Date) -> String {
  date.formatted(.dateTime.day().month(.wide).year().locale(Locale(identifier: "de_DE")))
}

struct CounterEntry: TimelineEntry {
  let date: Date
  let data: CoupleData

  var days: Int? {
    guard let start = data.start else { return nil }
    return max(0, daysBetween(start, date))
  }

  var daysText: String { days.map(formatNumber) ?? "–" }

  /// Kurzform für die Zeile über der Uhr auf dem Sperrbildschirm.
  var inlineText: String {
    let count = daysText
    let partner = data.partnerName
    return partner.isEmpty ? "♥ \(count) Tage" : "♥ \(count) Tage mit \(partner)"
  }

  /// Zusatzzeile für verlobte und verheiratete Paare.
  var weddingLine: String? {
    guard let wedding = data.wedding else { return nil }
    let inDays = daysBetween(date, wedding)
    if data.status == "engaged" || inDays > 0 {
      if inDays > 1 { return "💍 Hochzeit in \(formatNumber(inDays)) Tagen" }
      if inDays == 1 { return "💍 Morgen ist eure Hochzeit!" }
      if inDays == 0 { return "💍 Heute ist eure Hochzeit!" }
      return nil
    }
    if data.status == "married" { return "💍 Verheiratet seit \(formatNumber(-inDays)) Tagen" }
    return nil
  }
}

struct Provider: TimelineProvider {
  func placeholder(in context: Context) -> CounterEntry {
    CounterEntry(date: Date(), data: .sample)
  }

  func getSnapshot(in context: Context, completion: @escaping (CounterEntry) -> Void) {
    let data = CoupleData.load()
    completion(CounterEntry(date: Date(), data: data.start == nil ? .sample : data))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<CounterEntry>) -> Void) {
    let data = CoupleData.load()
    let calendar = Calendar.current
    var entries = [CounterEntry(date: Date(), data: data)]
    // Ein Eintrag pro Mitternacht – so zählt das Widget auch weiter, wenn die App eine Woche zu bleibt.
    var midnight = calendar.startOfDay(for: Date())
    for _ in 0..<7 {
      guard let next = calendar.date(byAdding: .day, value: 1, to: midnight) else { break }
      midnight = next
      entries.append(CounterEntry(date: midnight, data: data))
    }
    completion(Timeline(entries: entries, policy: .atEnd))
  }
}

struct GradientBackground: View {
  var body: some View {
    LinearGradient(colors: [pink, purple, blue], startPoint: .topLeading, endPoint: .bottomTrailing)
  }
}

struct EmptyHint: View {
  var body: some View {
    VStack(spacing: 4) {
      Text("♥").font(.title).foregroundStyle(.white)
      Text("Öffne Wir zwei, um euren Zähler zu sehen.")
        .font(.caption)
        .multilineTextAlignment(.center)
        .foregroundStyle(.white)
    }
  }
}

struct SmallView: View {
  let entry: CounterEntry

  var body: some View {
    if let days = entry.days {
      VStack(spacing: 2) {
        Text("\(entry.data.nameA) ♥ \(entry.data.nameB)")
          .font(.caption.weight(.bold))
          .lineLimit(1)
          .minimumScaleFactor(0.6)
        Spacer(minLength: 0)
        Text(formatNumber(days))
          .font(.system(size: 44, weight: .black, design: .rounded))
          .lineLimit(1)
          .minimumScaleFactor(0.5)
        Text(days == 1 ? "Tag zusammen" : "Tage zusammen")
          .font(.caption.weight(.semibold))
        Spacer(minLength: 0)
        if let line = entry.weddingLine {
          Text(line)
            .font(.system(size: 10, weight: .semibold))
            .lineLimit(1)
            .minimumScaleFactor(0.6)
        }
      }
      .foregroundStyle(.white)
    } else {
      EmptyHint()
    }
  }
}

struct MediumView: View {
  let entry: CounterEntry

  var body: some View {
    if let days = entry.days, let start = entry.data.start {
      HStack(spacing: 16) {
        VStack(spacing: 0) {
          Text(formatNumber(days))
            .font(.system(size: 54, weight: .black, design: .rounded))
            .lineLimit(1)
            .minimumScaleFactor(0.5)
          Text(days == 1 ? "Tag zusammen" : "Tage zusammen")
            .font(.subheadline.weight(.semibold))
        }
        .frame(maxWidth: .infinity)
        VStack(alignment: .leading, spacing: 6) {
          Text("\(entry.data.nameA) ♥ \(entry.data.nameB)")
            .font(.headline.weight(.heavy))
            .lineLimit(1)
            .minimumScaleFactor(0.6)
          Text("seit dem \(formatDay(start))")
            .font(.caption)
            .opacity(0.9)
          if let line = entry.weddingLine {
            Text(line)
              .font(.caption.weight(.bold))
              .lineLimit(2)
              .minimumScaleFactor(0.7)
          }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
      }
      .foregroundStyle(.white)
    } else {
      EmptyHint()
    }
  }
}

struct CounterView: View {
  @Environment(\.widgetFamily) var family
  let entry: CounterEntry

  var body: some View {
    switch family {
    case .accessoryCircular:
      VStack(spacing: 0) {
        Image(systemName: "heart.fill").font(.caption)
        Text(entry.daysText)
          .font(.system(size: 16, weight: .bold, design: .rounded))
          .lineLimit(1)
          .minimumScaleFactor(0.5)
      }
      .containerBackground(for: .widget) { AccessoryWidgetBackground() }
    case .accessoryRectangular:
      VStack(alignment: .leading, spacing: 1) {
        Text("♥ \(entry.daysText) Tage")
          .font(.headline)
          .lineLimit(1)
        Text(entry.data.partnerName.isEmpty ? "zusammen" : "mit \(entry.data.partnerName)")
          .font(.caption)
          .lineLimit(1)
        if let line = entry.weddingLine {
          Text(line).font(.caption2).lineLimit(1).minimumScaleFactor(0.7)
        }
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      .containerBackground(for: .widget) { Color.clear }
    case .accessoryInline:
      Text(entry.inlineText)
        .containerBackground(for: .widget) { Color.clear }
    case .systemMedium:
      MediumView(entry: entry)
        .containerBackground(for: .widget) { GradientBackground() }
    default:
      SmallView(entry: entry)
        .containerBackground(for: .widget) { GradientBackground() }
    }
  }
}

struct CounterWidget: Widget {
  let kind = "WirZweiCounter"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: Provider()) { entry in
      CounterView(entry: entry)
    }
    .configurationDisplayName("Zusammen-Zähler")
    .description("Wie lange ihr schon zusammen seid – immer im Blick.")
    .supportedFamilies([.systemSmall, .systemMedium, .accessoryCircular, .accessoryRectangular, .accessoryInline])
  }
}

// MARK: - Zeichnungs-Widget

/// Ein Strich, wie ihn die App speichert: Farbe, Breite, Punkte mit x/y von 0 bis 1000.
struct StrokeData: Decodable {
  let c: String
  let w: Double
  let p: [[Double]]
}

extension Color {
  init(hex: String) {
    var text = hex.trimmingCharacters(in: .whitespacesAndNewlines)
    if text.hasPrefix("#") { text.removeFirst() }
    var value: UInt64 = 0
    Scanner(string: text).scanHexInt64(&value)
    self.init(
      red: Double((value >> 16) & 0xFF) / 255,
      green: Double((value >> 8) & 0xFF) / 255,
      blue: Double(value & 0xFF) / 255)
  }
}

struct DrawingEntry: TimelineEntry {
  let date: Date
  let strokes: [StrokeData]
  let from: String
  let sentAt: Date?

  static func load() -> DrawingEntry {
    let defaults = UserDefaults(suiteName: appGroup)
    let json = defaults?.string(forKey: "drawing") ?? ""
    let strokes = (try? JSONDecoder().decode([StrokeData].self, from: Data(json.utf8))) ?? []
    // Supabase liefert UTC, z. B. 2026-10-20T12:34:56.123456+00:00 – die ersten 19 Zeichen reichen.
    var sentAt: Date?
    if let raw = defaults?.string(forKey: "drawingAt"), raw.count >= 19 {
      let formatter = DateFormatter()
      formatter.locale = Locale(identifier: "en_US_POSIX")
      formatter.timeZone = TimeZone(identifier: "UTC")
      formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
      sentAt = formatter.date(from: String(raw.prefix(19)))
    }
    return DrawingEntry(date: Date(), strokes: strokes, from: defaults?.string(forKey: "drawingFrom") ?? "", sentAt: sentAt)
  }

  static var sample: DrawingEntry {
    let heart: [[Double]] = [
      [500, 820], [260, 590], [200, 420], [260, 280], [380, 240], [500, 340],
      [620, 240], [740, 280], [800, 420], [740, 590], [500, 820],
    ]
    return DrawingEntry(date: Date(), strokes: [StrokeData(c: "#FF5FA2", w: 28, p: heart)], from: "Max", sentAt: Date())
  }
}

struct DrawingProvider: TimelineProvider {
  func placeholder(in context: Context) -> DrawingEntry { .sample }

  func getSnapshot(in context: Context, completion: @escaping (DrawingEntry) -> Void) {
    let entry = DrawingEntry.load()
    completion(entry.strokes.isEmpty ? .sample : entry)
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<DrawingEntry>) -> Void) {
    // Neue Zeichnungen meldet die App selbst (WidgetCenter.reloadAllTimelines) – stündlich nur zur Sicherheit.
    let next = Calendar.current.date(byAdding: .hour, value: 1, to: Date()) ?? Date()
    completion(Timeline(entries: [DrawingEntry.load()], policy: .after(next)))
  }
}

struct StrokesView: View {
  let strokes: [StrokeData]
  var monochrome = false

  var body: some View {
    GeometryReader { geo in
      let side = min(geo.size.width, geo.size.height)
      let scale = side / 1000
      ZStack {
        ForEach(0..<strokes.count, id: \.self) { index in
          let stroke = strokes[index]
          Path { path in
            guard let first = stroke.p.first, first.count >= 2 else { return }
            path.move(to: CGPoint(x: first[0] * scale, y: first[1] * scale))
            if stroke.p.count == 1 {
              path.addLine(to: CGPoint(x: first[0] * scale + 0.5, y: first[1] * scale + 0.5))
            }
            for point in stroke.p.dropFirst() where point.count >= 2 {
              path.addLine(to: CGPoint(x: point[0] * scale, y: point[1] * scale))
            }
          }
          .stroke(
            monochrome ? Color.primary : Color(hex: stroke.c),
            style: StrokeStyle(lineWidth: max(1, stroke.w * scale), lineCap: .round, lineJoin: .round))
        }
      }
      .frame(width: side, height: side)
      .position(x: geo.size.width / 2, y: geo.size.height / 2)
    }
  }
}

struct DrawingCaption: View {
  let entry: DrawingEntry

  var body: some View {
    HStack(spacing: 3) {
      Text(entry.from.isEmpty ? "Zeichnung" : "von \(entry.from)")
        .fontWeight(.semibold)
      if let sentAt = entry.sentAt {
        Text("·")
        Text(sentAt, style: .relative)
      }
    }
    .font(.caption2)
    .foregroundStyle(pink)
    .lineLimit(1)
    .minimumScaleFactor(0.7)
  }
}

struct DrawingEmpty: View {
  var body: some View {
    VStack(spacing: 4) {
      Text("🎨").font(.title)
      Text("Noch keine Zeichnung")
        .font(.caption.weight(.bold))
        .foregroundStyle(pink)
      Text("Öffne Wir zwei und mal deinem Schatz etwas.")
        .font(.caption2)
        .multilineTextAlignment(.center)
        .foregroundStyle(.secondary)
    }
  }
}

struct DrawingWidgetView: View {
  @Environment(\.widgetFamily) var family
  let entry: DrawingEntry

  var body: some View {
    switch family {
    case .accessoryCircular:
      StrokesView(strokes: entry.strokes, monochrome: true)
        .padding(6)
        .containerBackground(for: .widget) { AccessoryWidgetBackground() }
    case .accessoryRectangular:
      HStack(spacing: 6) {
        StrokesView(strokes: entry.strokes, monochrome: true)
          .frame(width: 50, height: 50)
        VStack(alignment: .leading, spacing: 1) {
          Text("🎨 Zeichnung").font(.headline).lineLimit(1)
          Text(entry.from.isEmpty ? "von deinem Schatz" : "von \(entry.from)").font(.caption).lineLimit(1)
        }
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      .containerBackground(for: .widget) { Color.clear }
    case .systemMedium:
      Group {
        if entry.strokes.isEmpty {
          DrawingEmpty()
        } else {
          HStack(spacing: 12) {
            StrokesView(strokes: entry.strokes)
            VStack(alignment: .leading, spacing: 4) {
              Text("💌 Für dich").font(.headline.weight(.heavy)).foregroundStyle(pink)
              DrawingCaption(entry: entry)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
          }
        }
      }
      .containerBackground(for: .widget) { Color.white }
    default:
      Group {
        if entry.strokes.isEmpty {
          DrawingEmpty()
        } else {
          VStack(spacing: 4) {
            StrokesView(strokes: entry.strokes)
            DrawingCaption(entry: entry)
          }
        }
      }
      .containerBackground(for: .widget) { Color.white }
    }
  }
}

struct DrawingWidget: Widget {
  let kind = "WirZweiDrawing"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: DrawingProvider()) { entry in
      DrawingWidgetView(entry: entry)
    }
    .configurationDisplayName("Zeichnung")
    .description("Die neueste Zeichnung deines Schatzes.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .accessoryCircular, .accessoryRectangular])
  }
}

@main
struct WirZweiWidgets: WidgetBundle {
  var body: some Widget {
    CounterWidget()
    DrawingWidget()
  }
}
