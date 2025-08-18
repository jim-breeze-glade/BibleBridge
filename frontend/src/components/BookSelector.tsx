/**
 * BookSelector Component - Testament and book selection
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { BookSelectorProps, BookMetadata } from '../types';

// Styled components
const SelectorContainer = styled.div<{ theme: 'light' | 'dark' }>`
  position: relative;
  display: inline-block;
  min-width: 200px;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const SelectorButton = styled.button<{ theme: 'light' | 'dark'; isOpen: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 16px;
  background-color: ${(props) => (props.theme === 'dark' ? '#2d3748' : '#ffffff')};
  border: 1px solid ${(props) => 
    props.isOpen 
      ? '#007bff'
      : (props.theme === 'dark' ? '#4a5568' : '#ced4da')
  };
  border-radius: 8px;
  color: ${(props) => (props.theme === 'dark' ? '#f7fafc' : '#2d3748')};
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${(props) => 
    props.isOpen 
      ? '0 0 0 2px rgba(0, 123, 255, 0.25)'
      : '0 2px 4px rgba(0, 0, 0, 0.1)'
  };

  &:hover {
    border-color: ${(props) => (props.theme === 'dark' ? '#6b7280' : '#adb5bd')};
  }

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  .arrow {
    transition: transform 0.2s ease;
    transform: ${(props) => (props.isOpen ? 'rotate(180deg)' : 'rotate(0deg)')};
  }
`;

const BookInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
  text-align: left;
`;

const BookName = styled.div`
  font-size: 1em;
  font-weight: 600;
`;

const TestamentName = styled.div<{ theme: 'light' | 'dark' }>`
  font-size: 0.8em;
  color: ${(props) => (props.theme === 'dark' ? '#a0aec0' : '#6c757d')};
  margin-top: 2px;
`;

const DropdownContainer = styled.div<{ theme: 'light' | 'dark'; isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  background-color: ${(props) => (props.theme === 'dark' ? '#2d3748' : '#ffffff')};
  border: 1px solid ${(props) => (props.theme === 'dark' ? '#4a5568' : '#e2e8f0')};
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  margin-top: 4px;
  max-height: 400px;
  overflow-y: auto;
  display: ${(props) => (props.isOpen ? 'block' : 'none')};

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${(props) => (props.theme === 'dark' ? '#4a5568' : '#f1f1f1')};
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${(props) => (props.theme === 'dark' ? '#6b7280' : '#c1c1c1')};
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${(props) => (props.theme === 'dark' ? '#9ca3af' : '#a8a8a8')};
  }
`;

const TestamentSection = styled.div`
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const TestamentHeader = styled.div<{ theme: 'light' | 'dark' }>`
  padding: 12px 16px 8px 16px;
  font-size: 0.9em;
  font-weight: 600;
  color: ${(props) => (props.theme === 'dark' ? '#a0aec0' : '#6c757d')};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid ${(props) => (props.theme === 'dark' ? '#4a5568' : '#f1f3f4')};
  background-color: ${(props) => (props.theme === 'dark' ? '#1a202c' : '#f8f9fa')};
  position: sticky;
  top: 0;
  z-index: 10;
`;

const BookItem = styled.div<{ 
  theme: 'light' | 'dark'; 
  isSelected: boolean; 
  isHighlighted: boolean 
}>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${(props) => {
    if (props.isSelected) {
      return props.theme === 'dark' ? '#4c51bf' : '#007bff';
    }
    if (props.isHighlighted) {
      return props.theme === 'dark' ? '#3c4043' : '#f8f9fa';
    }
    return 'transparent';
  }};
  color: ${(props) => {
    if (props.isSelected) {
      return '#ffffff';
    }
    return props.theme === 'dark' ? '#f7fafc' : '#2d3748';
  }};

  &:hover {
    background-color: ${(props) => {
      if (props.isSelected) {
        return props.theme === 'dark' ? '#5a67d8' : '#0056b3';
      }
      return props.theme === 'dark' ? '#3c4043' : '#f8f9fa';
    }};
  }
`;

const BookItemInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const BookItemName = styled.div`
  font-size: 0.95em;
  font-weight: 500;
`;

const ChapterCount = styled.div<{ theme: 'light' | 'dark'; isSelected: boolean }>`
  font-size: 0.75em;
  color: ${(props) => {
    if (props.isSelected) {
      return 'rgba(255, 255, 255, 0.8)';
    }
    return props.theme === 'dark' ? '#a0aec0' : '#6c757d';
  }};
  margin-top: 2px;
`;

const BookOrder = styled.div<{ theme: 'light' | 'dark'; isSelected: boolean }>`
  font-size: 0.8em;
  color: ${(props) => {
    if (props.isSelected) {
      return 'rgba(255, 255, 255, 0.7)';
    }
    return props.theme === 'dark' ? '#718096' : '#8e9aaf';
  }};
  font-weight: 500;
  min-width: 30px;
  text-align: right;
`;

const SearchInput = styled.input<{ theme: 'light' | 'dark' }>`
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-bottom: 1px solid ${(props) => (props.theme === 'dark' ? '#4a5568' : '#e2e8f0')};
  background-color: ${(props) => (props.theme === 'dark' ? '#2d3748' : '#ffffff')};
  color: ${(props) => (props.theme === 'dark' ? '#f7fafc' : '#2d3748')};
  font-size: 0.9em;
  outline: none;
  position: sticky;
  top: 0;
  z-index: 11;

  &::placeholder {
    color: ${(props) => (props.theme === 'dark' ? '#a0aec0' : '#8e9aaf')};
  }

  &:focus {
    border-bottom-color: #007bff;
  }
`;

const NoResults = styled.div<{ theme: 'light' | 'dark' }>`
  padding: 20px;
  text-align: center;
  color: ${(props) => (props.theme === 'dark' ? '#a0aec0' : '#6c757d')};
  font-size: 0.9em;
`;

const BookSelector: React.FC<BookSelectorProps & { theme: 'light' | 'dark' }> = ({
  books,
  currentBook,
  onBookSelect,
  isOpen,
  onToggle,
  theme = 'light',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Group books by testament
  const groupedBooks = useMemo(() => {
    const oldTestament = books.filter(book => book.testament === 'Old Testament');
    const newTestament = books.filter(book => book.testament === 'New Testament');
    
    return { oldTestament, newTestament };
  }, [books]);

  // Filter books based on search term
  const filteredBooks = useMemo(() => {
    if (!searchTerm.trim()) {
      return groupedBooks;
    }

    const searchLower = searchTerm.toLowerCase();
    const oldTestament = groupedBooks.oldTestament.filter(book =>
      book.name.toLowerCase().includes(searchLower)
    );
    const newTestament = groupedBooks.newTestament.filter(book =>
      book.name.toLowerCase().includes(searchLower)
    );

    return { oldTestament, newTestament };
  }, [groupedBooks, searchTerm]);

  // Get all filtered books as flat array for navigation
  const allFilteredBooks = useMemo(() => [
    ...filteredBooks.oldTestament,
    ...filteredBooks.newTestament,
  ], [filteredBooks]);

  // Get current book info
  const currentBookInfo = useMemo(() => 
    books.find(book => book.name === currentBook),
    [books, currentBook]
  );

  // Handle book selection
  const handleBookSelect = useCallback((book: BookMetadata) => {
    onBookSelect(book.name);
    onToggle();
    setSearchTerm('');
    setHighlightedIndex(0);
  }, [onBookSelect, onToggle]);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setHighlightedIndex(0);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < allFilteredBooks.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : allFilteredBooks.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (allFilteredBooks[highlightedIndex]) {
          handleBookSelect(allFilteredBooks[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onToggle();
        setSearchTerm('');
        break;
    }
  }, [isOpen, allFilteredBooks, highlightedIndex, handleBookSelect, onToggle]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (isOpen) {
          onToggle();
          setSearchTerm('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.querySelector(
        `[data-index="${highlightedIndex}"]`
      );
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ 
          block: 'nearest', 
          behavior: 'smooth' 
        });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Render book items for a testament
  const renderTestamentBooks = (testamentBooks: BookMetadata[], testament: string) => {
    if (testamentBooks.length === 0) return null;

    return (
      <TestamentSection key={testament}>
        <TestamentHeader theme={theme}>
          {testament} ({testamentBooks.length} books)
        </TestamentHeader>
        {testamentBooks.map((book, index) => {
          const globalIndex = testament === 'Old Testament' 
            ? index 
            : filteredBooks.oldTestament.length + index;
          const isSelected = book.name === currentBook;
          const isHighlighted = globalIndex === highlightedIndex;

          return (
            <BookItem
              key={book.name}
              theme={theme}
              isSelected={isSelected}
              isHighlighted={isHighlighted}
              data-index={globalIndex}
              onClick={() => handleBookSelect(book)}
            >
              <BookItemInfo>
                <BookItemName>{book.name}</BookItemName>
                <ChapterCount theme={theme} isSelected={isSelected}>
                  {book.chapterCount} chapters
                </ChapterCount>
              </BookItemInfo>
              <BookOrder theme={theme} isSelected={isSelected}>
                {book.order}
              </BookOrder>
            </BookItem>
          );
        })}
      </TestamentSection>
    );
  };

  return (
    <SelectorContainer 
      theme={theme} 
      ref={dropdownRef} 
      onKeyDown={handleKeyDown}
    >
      <SelectorButton
        theme={theme}
        isOpen={isOpen}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <BookInfo>
          <BookName>{currentBook}</BookName>
          {currentBookInfo && (
            <TestamentName theme={theme}>
              {currentBookInfo.testament} • {currentBookInfo.chapterCount} chapters
            </TestamentName>
          )}
        </BookInfo>
        <span className="arrow">▼</span>
      </SelectorButton>

      <DropdownContainer theme={theme} isOpen={isOpen}>
        <SearchInput
          ref={searchRef}
          theme={theme}
          type="text"
          placeholder="Search books..."
          value={searchTerm}
          onChange={handleSearchChange}
        />

        {allFilteredBooks.length > 0 ? (
          <>
            {renderTestamentBooks(filteredBooks.oldTestament, 'Old Testament')}
            {renderTestamentBooks(filteredBooks.newTestament, 'New Testament')}
          </>
        ) : (
          <NoResults theme={theme}>
            No books found matching "{searchTerm}"
          </NoResults>
        )}
      </DropdownContainer>
    </SelectorContainer>
  );
};

export default BookSelector;