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

@main
struct WirZweiWidgets: WidgetBundle {
  var body: some Widget {
    CounterWidget()
  }
}
