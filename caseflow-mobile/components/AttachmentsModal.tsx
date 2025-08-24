import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Attachment } from '../types';
import { attachmentService } from '../services/attachmentService';
import Modal from './Modal';
import AttachmentViewer from './AttachmentViewer';
import Spinner from './Spinner';
import { useSafeArea } from './SafeAreaProvider';

interface AttachmentsModalProps {
  caseId: string;
  isVisible: boolean;
  onClose: () => void;
}

const AttachmentsModal: React.FC<AttachmentsModalProps> = ({ caseId, isVisible, onClose }) => {
  const { deviceInfo } = useSafeArea();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);

  useEffect(() => {
    if (isVisible && caseId) {
      fetchAttachments();
    }
    // Reset state when modal closes
    if (!isVisible) {
      setAttachments([]);
      setError(null);
      setSelectedAttachment(null);
      setViewerVisible(false);
    }
  }, [isVisible, caseId]);

  const fetchAttachments = async () => {
    setLoading(true);
    setError(null);

    try {
      const caseAttachments = await attachmentService.getCaseAttachments(caseId);
      setAttachments(caseAttachments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attachments');
    } finally {
      setLoading(false);
    }
  };

  const handleAttachmentClick = (attachment: Attachment) => {
    setSelectedAttachment(attachment);
    setViewerVisible(true);
  };

  const handleViewerClose = () => {
    setViewerVisible(false);
    setSelectedAttachment(null);
  };

  const renderAttachmentItem = (attachment: Attachment) => (
    <TouchableOpacity
      key={attachment.id}
      onPress={() => handleAttachmentClick(attachment)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#1f2937',
        borderRadius: 8,
        marginBottom: 12
      }}
    >
      {/* File Icon */}
      <View style={{ width: 48, height: 48, backgroundColor: '#374151', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
        <Text style={{ fontSize: 24 }}>{attachmentService.getFileTypeIcon(attachment)}</Text>
      </View>

      {/* File Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#ffffff', fontWeight: '500', fontSize: 16 }} numberOfLines={1}>
          {attachment.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Text style={{ color: '#9ca3af', fontSize: 12, textTransform: 'uppercase', fontWeight: '500', marginRight: 16 }}>
            {attachment.type}
          </Text>
          <Text style={{ color: '#9ca3af', fontSize: 12, marginRight: 16 }}>
            {attachmentService.formatFileSize(attachment.size)}
          </Text>
          <Text style={{ color: '#9ca3af', fontSize: 12 }}>
            {new Date(attachment.uploadedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </Text>
        </View>
        <Text style={{ color: '#6b7280', fontSize: 11, marginTop: 2 }}>
          Uploaded by {attachment.uploadedBy}
        </Text>
        {attachment.description && (
          <Text style={{ color: '#9ca3af', fontSize: 11, marginTop: 2 }} numberOfLines={1}>
            {attachment.description}
          </Text>
        )}
      </View>

      {/* View Indicator */}
      <View style={{ width: 32, height: 32, backgroundColor: '#2563eb', borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#ffffff', fontSize: 12 }}>👁️</Text>
      </View>
    </TouchableOpacity>
  );



  const renderContent = () => {
    if (loading) {
      return (
        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
          <Spinner size="large" />
          <Text style={{ color: '#9ca3af', marginTop: 16 }}>Loading attachments...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
          <Text style={{ color: '#ef4444', fontSize: 48, marginBottom: 16 }}>❌</Text>
          <Text style={{ color: '#ef4444', textAlign: 'center', marginBottom: 16 }}>{error}</Text>
          <TouchableOpacity
            onPress={fetchAttachments}
            style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#2563eb', borderRadius: 6 }}
          >
            <Text style={{ color: '#ffffff' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (attachments.length === 0) {
      return (
        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
          <Text style={{ color: '#9ca3af', fontSize: 48, marginBottom: 16 }}>📎</Text>
          <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '500', marginBottom: 8 }}>No Attachments</Text>
          <Text style={{ color: '#9ca3af', textAlign: 'center' }}>
            This case doesn't have any attachments yet.
          </Text>
        </View>
      );
    }

    return (
      <View>
        <View style={{ maxHeight: 384 }}>
          {attachments.map(renderAttachmentItem)}
        </View>
      </View>
    );
  };



  return (
    <>
      <Modal
        isVisible={isVisible}
        onClose={onClose}
        title={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 24, marginRight: 8 }}>📎</Text>
            <View>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#ffffff' }}>Case Attachments</Text>
              <Text style={{ fontSize: 14, color: '#9ca3af' }}>
                {loading ? 'Loading...' : `${attachments.length} attachment${attachments.length !== 1 ? 's' : ''}`}
              </Text>
            </View>
          </View>
        }
        size="large"
      >
        {renderContent()}
      </Modal>

      {/* Attachment Viewer - Only render on web platform to avoid React Native errors */}
      {selectedAttachment && deviceInfo.platform === 'web' && (
        <AttachmentViewer
          attachment={selectedAttachment}
          isVisible={viewerVisible}
          onClose={handleViewerClose}
        />
      )}
    </>
  );
};

export default AttachmentsModal;
