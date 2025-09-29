# 💧 Water Tracker

A beautiful and intuitive React application for tracking daily water intake with data visualization and progress tracking.

## Features

- 📊 **Daily Progress Tracking**: Visual progress ring and percentage completion
- 📈 **14-Day History Chart**: Line chart showing water intake over the last 14 days
- ⚡ **Quick Add Buttons**: Predefined amounts (200ml, 250ml, 300ml, 330ml, 500ml, 700ml)
- 🎯 **Custom Goal Setting**: Set your daily water intake goal in liters
- 📝 **Entry History**: View all water entries for the current day with timestamps
- 🔄 **Undo Functionality**: Remove the last added entry
- 💾 **Local Storage**: All data is saved locally in your browser
- 📤 **Export/Import**: Backup and restore your data as JSON files
- 📱 **Responsive Design**: Works perfectly on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/lommaks777/watertracker.git
cd watertracker
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Usage

1. **Set Your Goal**: Adjust your daily water intake goal using the input field in the header
2. **Add Water**: Click on predefined amounts or enter a custom amount
3. **Track Progress**: Watch your progress ring fill up as you reach your daily goal
4. **View History**: Check the 14-day chart to see your hydration patterns
5. **Manage Entries**: Use the undo button to remove the last entry, or reset the entire day

## Data Management

- All data is stored locally in your browser's localStorage
- Use the "Export JSON" button to create a backup of your data
- Use the "Import JSON" button to restore data from a backup file
- Data is automatically cleaned up after 400 days to prevent storage bloat

## Technologies Used

- **React 18** - Modern React with hooks
- **Recharts** - Beautiful and responsive charts
- **Tailwind CSS** - Utility-first CSS framework
- **Local Storage** - Client-side data persistence

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the MIT License.

## Author

Created by [lommaks777](https://github.com/lommaks777)

---

Made with ❤️ for better hydration habits! 💧
