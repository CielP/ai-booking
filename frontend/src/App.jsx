import { useState } from 'react';
import AvailableRooms from './pages/AvailableRooms';
import BookRoom from './pages/BookRoom';
import MyBookings from './pages/MyBookings';
import CancelBooking from './pages/CancelBooking';
import './index.css';

const TABS = [
  { id: 'available', label: '查詢空房' },
  { id: 'book',      label: '預訂房間' },
  { id: 'mybookings',label: '查詢訂單' },
  { id: 'cancel',    label: '取消訂單' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('available');
  const [bookPrefill, setBookPrefill] = useState(null);

  function handleBook(prefill) {
    setBookPrefill(prefill);
    setActiveTab('book');
  }

  return (
    <div className="app">
      <h1>🏨 旅館訂房系統</h1>
      <div className="tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'available'  && <AvailableRooms onBook={handleBook} />}
      {activeTab === 'book'       && <BookRoom prefill={bookPrefill} />}
      {activeTab === 'mybookings' && <MyBookings />}
      {activeTab === 'cancel'     && <CancelBooking />}
    </div>
  );
}
