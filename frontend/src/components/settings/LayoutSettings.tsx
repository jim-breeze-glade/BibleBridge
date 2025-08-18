/**
 * LayoutSettings Component - Layout and spacing customization controls
 */

import React, { useCallback } from 'react';
import styled from 'styled-components';
import { useBible } from '../../context/BibleContext';
import Slider from '../ui/Slider';

const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--theme-text-primary);
  border-bottom: 2px solid var(--theme-border);
  padding-bottom: 8px;
`;

const ControlsGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InfoText = styled.p`
  margin: 8px 0 0 0;
  font-size: 13px;
  color: var(--theme-text-secondary);
  font-style: italic;
  line-height: 1.4;
`;

const PreviewContainer = styled.div`
  background: var(--theme-bg-secondary);
  border: 2px solid var(--theme-border);
  border-radius: 8px;
  padding: 16px;
  margin-top: 12px;
  position: relative;
  overflow: hidden;
`;

const PreviewLayout = styled.div<{
  sidebarWidth: number;
  panelSpacing: number;
  lineHeight: number;
}>`
  display: flex;
  gap: ${props => props.panelSpacing}px;
  font-size: 12px;
  line-height: ${props => props.lineHeight};
  
  .sidebar {
    width: ${props => Math.round(props.sidebarWidth * 0.3)}px;
    background: var(--theme-bg-tertiary);
    border-radius: 4px;
    padding: 8px;
    font-size: 10px;
    color: var(--theme-text-secondary);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .content {
    flex: 1;
    background: var(--theme-bg-primary);
    border: 1px solid var(--theme-border);
    border-radius: 4px;
    padding: 8px;
    color: var(--theme-text-primary);
  }
`;

const MockSidebarItem = styled.div`
  padding: 3px 6px;
  background: var(--theme-bg-secondary);
  border-radius: 3px;
  font-size: 9px;
`;

const MockContent = styled.div`
  font-size: 11px;
  
  .verse {
    margin-bottom: 4px;
    
    .verse-number {
      font-weight: bold;
      color: var(--theme-text-muted);
      margin-right: 4px;
    }
  }
`;

const ResetButton = styled.button`
  padding: 8px 16px;
  background: var(--theme-bg-tertiary);
  border: 2px solid var(--theme-border);
  border-radius: 6px;
  color: var(--theme-text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  align-self: flex-start;

  &:hover {
    background: var(--theme-bg-secondary);
    border-color: var(--theme-accent);
  }

  &:focus {
    outline: none;
    border-color: var(--theme-accent);
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.2);
  }
`;

const LayoutSettings: React.FC = () => {
  const { state, actions } = useBible();
  const settings = state.userSettings;

  const handleSidebarWidthChange = useCallback((width: number) => {
    actions.updateUserSettings({ sidebarWidth: width });
  }, [actions]);

  const handlePanelSpacingChange = useCallback((spacing: number) => {
    actions.updateUserSettings({ panelSpacing: spacing });
  }, [actions]);

  const handleLineHeightChange = useCallback((lineHeight: number) => {
    actions.updateUserSettings({ lineHeight });
  }, [actions]);

  const handleReset = useCallback(() => {
    actions.updateUserSettings({
      sidebarWidth: 300,
      panelSpacing: 16,
      lineHeight: 1.6,
    });
  }, [actions]);

  return (
    <LayoutContainer>
      <SectionTitle>Layout & Spacing</SectionTitle>
      
      <InfoText>
        Customize the layout and spacing of Bible study panels to optimize 
        your reading experience across different screen sizes.
      </InfoText>

      <ControlsGroup>
        <Slider
          label="Sidebar Width"
          value={settings.sidebarWidth || 300}
          min={200}
          max={500}
          step={10}
          unit="px"
          onChange={handleSidebarWidthChange}
        />

        <Slider
          label="Panel Spacing"
          value={settings.panelSpacing || 16}
          min={8}
          max={32}
          step={2}
          unit="px"
          onChange={handlePanelSpacingChange}
        />

        <Slider
          label="Line Height"
          value={settings.lineHeight || 1.6}
          min={1.2}
          max={2.0}
          step={0.1}
          onChange={handleLineHeightChange}
        />

        <ResetButton onClick={handleReset}>
          Reset Layout Settings
        </ResetButton>
      </ControlsGroup>

      <PreviewContainer>
        <div style={{ marginBottom: '12px', fontSize: '13px', fontWeight: '600' }}>
          Layout Preview
        </div>
        
        <PreviewLayout
          sidebarWidth={settings.sidebarWidth || 300}
          panelSpacing={settings.panelSpacing || 16}
          lineHeight={settings.lineHeight || 1.6}
        >
          <div className="sidebar">
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>Navigation</div>
            <MockSidebarItem>Genesis</MockSidebarItem>
            <MockSidebarItem>Exodus</MockSidebarItem>
            <MockSidebarItem>Leviticus</MockSidebarItem>
            <div style={{ 
              fontSize: '8px', 
              color: 'var(--theme-text-muted)', 
              marginTop: '4px',
              textAlign: 'center'
            }}>
              {Math.round(settings.sidebarWidth || 300)}px wide
            </div>
          </div>
          
          <div className="content">
            <MockContent>
              <div style={{ fontWeight: '600', marginBottom: '6px' }}>
                Genesis 1 (KJV)
              </div>
              <div className="verse">
                <span className="verse-number">1</span>
                In the beginning God created the heaven and the earth.
              </div>
              <div className="verse">
                <span className="verse-number">2</span>
                And the earth was without form, and void; and darkness was upon the face of the deep.
              </div>
              <div style={{ 
                fontSize: '9px', 
                color: 'var(--theme-text-muted)', 
                marginTop: '6px',
                textAlign: 'center'
              }}>
                Gap: {settings.panelSpacing || 16}px | Line height: {(settings.lineHeight || 1.6).toFixed(1)}
              </div>
            </MockContent>
          </div>
        </PreviewLayout>
      </PreviewContainer>
    </LayoutContainer>
  );
};

export default LayoutSettings;