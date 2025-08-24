import React, { useState, useMemo, useRef, useEffect } from 'react';
// Fixed JSX compilation errors - converted HTML elements to React Native components
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Case, CaseStatus, VerificationType, VerificationOutcome, RevokeReason } from '../types';
import { useCases } from '../context/CaseContext';
import { ChevronDownIcon, ChevronUpIcon, CheckIcon, XIcon, InfoIcon, ArrowUpIcon, ArrowDownIcon, AttachmentIcon } from './Icons';
import Spinner from './Spinner';
import Modal from './Modal';
import PriorityInput from './PriorityInput';
import { useCaseAutoSaveStatus } from '../hooks/useCaseAutoSaveStatus';
import CaseTimeline from './CaseTimeline';
import AttachmentsModal from './AttachmentsModal';
import PositiveResidenceForm from './forms/residence/PositiveResidenceForm';
import ShiftedResidenceForm from './forms/residence/ShiftedResidenceForm';
import NspResidenceForm from './forms/residence/NspResidenceForm';
import EntryRestrictedResidenceForm from './forms/residence/EntryRestrictedResidenceForm';
import UntraceableResidenceForm from './forms/residence/UntraceableResidenceForm';
import PositiveResiCumOfficeForm from './forms/residence-cum-office/PositiveResiCumOfficeForm';
import ShiftedResiCumOfficeForm from './forms/residence-cum-office/ShiftedResiCumOfficeForm';
import NspResiCumOfficeForm from './forms/residence-cum-office/NspResiCumOfficeForm';
import EntryRestrictedResiCumOfficeForm from './forms/residence-cum-office/EntryRestrictedResiCumOfficeForm';
import UntraceableResiCumOfficeForm from './forms/residence-cum-office/UntraceableResiCumOfficeForm';
import PositiveOfficeForm from './forms/office/PositiveOfficeForm';
import ShiftedOfficeForm from './forms/office/ShiftedOfficeForm';
import NspOfficeForm from './forms/office/NspOfficeForm';
import EntryRestrictedOfficeForm from './forms/office/EntryRestrictedOfficeForm';
import UntraceableOfficeForm from './forms/office/UntraceableOfficeForm';
import PositiveBusinessForm from './forms/business/PositiveBusinessForm';
import ShiftedBusinessForm from './forms/business/ShiftedBusinessForm';
import NspBusinessForm from './forms/business/NspBusinessForm';
import EntryRestrictedBusinessForm from './forms/business/EntryRestrictedBusinessForm';
import UntraceableBusinessForm from './forms/business/UntraceableBusinessForm';
import PositiveBuilderForm from './forms/builder/PositiveBuilderForm';
import ShiftedBuilderForm from './forms/builder/ShiftedBuilderForm';
import NspBuilderForm from './forms/builder/NspBuilderForm';
import EntryRestrictedBuilderForm from './forms/builder/EntryRestrictedBuilderForm';
import UntraceableBuilderForm from './forms/builder/UntraceableBuilderForm';
import PositiveNocForm from './forms/noc/PositiveNocForm';
import ShiftedNocForm from './forms/noc/ShiftedNocForm';
import NspNocForm from './forms/noc/NspNocForm';
import EntryRestrictedNocForm from './forms/noc/EntryRestrictedNocForm';
import UntraceableNocForm from './forms/noc/UntraceableNocForm';
import PositiveDsaForm from './forms/dsa-dst-connector/PositiveDsaForm';
import ShiftedDsaForm from './forms/dsa-dst-connector/ShiftedDsaForm';
import NspDsaForm from './forms/dsa-dst-connector/NspDsaForm';
import EntryRestrictedDsaForm from './forms/dsa-dst-connector/EntryRestrictedDsaForm';
import UntraceableDsaForm from './forms/dsa-dst-connector/UntraceableDsaForm';
import PositiveNegativePropertyApfForm from './forms/property-apf/PositiveNegativePropertyApfForm';
import EntryRestrictedPropertyApfForm from './forms/property-apf/EntryRestrictedPropertyApfForm';
import UntraceablePropertyApfForm from './forms/property-apf/UntraceablePropertyApfForm';
import PositivePropertyIndividualForm from './forms/property-individual/PositivePropertyIndividualForm';
import NspPropertyIndividualForm from './forms/property-individual/NspPropertyIndividualForm';
import EntryRestrictedPropertyIndividualForm from './forms/property-individual/EntryRestrictedPropertyIndividualForm';
import UntraceablePropertyIndividualForm from './forms/property-individual/UntraceablePropertyIndividualForm';
import { SelectField } from './FormControls';

interface CaseCardProps {
  caseData: Case;
  isReorderable?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}

const getEnumOptions = (enumObject: object): React.ReactElement[] => Object.values(enumObject).map(value => (
  <option key={value} value={value}>{value}</option>
));

const commonOutcomes = {
    PositiveAndDoorLocked: VerificationOutcome.PositiveAndDoorLocked,
    ShiftedAndDoorLocked: VerificationOutcome.ShiftedAndDoorLocked,
    NSPAndDoorLocked: VerificationOutcome.NSPAndDoorLocked,
    ERT: VerificationOutcome.ERT,
    Untraceable: VerificationOutcome.Untraceable,
};

const verificationOptionsMap: { [key in VerificationType]?: React.ReactElement[] } = {
    [VerificationType.Residence]: getEnumOptions(commonOutcomes),
    [VerificationType.ResidenceCumOffice]: getEnumOptions(commonOutcomes),
    [VerificationType.Office]: getEnumOptions(commonOutcomes),
    [VerificationType.Business]: getEnumOptions(commonOutcomes),
    [VerificationType.Builder]: getEnumOptions(commonOutcomes),
    [VerificationType.NOC]: getEnumOptions(commonOutcomes),
    [VerificationType.Connector]: getEnumOptions(commonOutcomes),
    [VerificationType.PropertyAPF]: getEnumOptions({
        PositiveAndDoorLocked: VerificationOutcome.PositiveAndDoorLocked,
        ERT: VerificationOutcome.ERT,
        Untraceable: VerificationOutcome.Untraceable,
    }),
    [VerificationType.PropertyIndividual]: getEnumOptions({
        PositiveAndDoorLocked: VerificationOutcome.PositiveAndDoorLocked,
        NSPAndDoorLocked: VerificationOutcome.NSPAndDoorLocked,
        ERT: VerificationOutcome.ERT,
        Untraceable: VerificationOutcome.Untraceable,
    }),
};

const CaseCard: React.FC<CaseCardProps> = ({ caseData, isReorderable = false, isFirst, isLast }) => {
  const { updateCaseStatus, toggleSaveCase, updateVerificationOutcome, revokeCase, reorderInProgressCase, submitCase, resubmitCase } = useCases();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState<RevokeReason>(RevokeReason.NotMyArea);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);
  const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false);

  // Check for auto-saved data for this case
  const { hasAutoSaveData } = useCaseAutoSaveStatus(caseData.id);

  // Get attachment count for display
  const attachmentCount = caseData.attachments?.length || 0;
  const [isFormExpanding, setIsFormExpanding] = useState(false);
  const [isFormScrollable, setIsFormScrollable] = useState(false);
  const formContentRef = useRef<HTMLDivElement>(null);
  
  const isAssigned = caseData.status === CaseStatus.Assigned;
  const isInProgress = caseData.status === CaseStatus.InProgress;
  const isCompletedOrSaved = caseData.status === CaseStatus.Completed || caseData.isSaved;



  const handleOutcomeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // Prevent event bubbling to avoid card collapse
    e.stopPropagation();

    const newOutcome = e.target.value as VerificationOutcome || null;
    updateVerificationOutcome(caseData.id, newOutcome);

    // Automatically expand the card to show the form when an outcome is selected
    if (newOutcome && !isExpanded) {
      setIsFormExpanding(true);
      setIsExpanded(true);

      // Scroll to the form content after a brief delay to allow expansion animation
      setTimeout(() => {
        setIsFormExpanding(false);
        if (formContentRef.current) {
          // Scroll the form container into view
          formContentRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
          });

          // Reset the form's internal scroll position to top
          formContentRef.current.scrollTop = 0;

          // Check if content is scrollable
          const isScrollable = formContentRef.current.scrollHeight > formContentRef.current.clientHeight;
          setIsFormScrollable(isScrollable);
        }
      }, 300); // Wait for expansion animation to start
    }
  };

  const handleRevokeConfirm = () => {
    if (revokeReason) {
        revokeCase(caseData.id, revokeReason);
        setIsRevokeModalOpen(false);
    }
  };

  const handleSubmitCase = async () => {
    setIsSubmitting(true);
    setSubmissionMessage(null);

    try {
      const result = await submitCase(caseData.id);
      if (result.success) {
        setSubmissionMessage('Case submitted successfully!');
        setTimeout(() => setSubmissionMessage(null), 3000);
      } else {
        setSubmissionMessage(result.error || 'Submission failed');
      }
    } catch (error) {
      setSubmissionMessage('Submission failed - please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResubmitCase = async () => {
    setIsSubmitting(true);
    setSubmissionMessage(null);

    try {
      const result = await resubmitCase(caseData.id);
      if (result.success) {
        setSubmissionMessage('Case resubmitted successfully!');
        setTimeout(() => setSubmissionMessage(null), 3000);
      } else {
        setSubmissionMessage(result.error || 'Resubmission failed');
      }
    } catch (error) {
      setSubmissionMessage('Resubmission failed - please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = () => {
    if (caseData.status === CaseStatus.Completed) {
      switch (caseData.submissionStatus) {
        case 'success':
          return 'border-l-4 border-green-500 bg-green-900/20';
        case 'failed':
          return 'border-l-4 border-red-500 bg-red-900/20';
        case 'submitting':
          return 'border-l-4 border-yellow-500 bg-yellow-900/20';
        case 'pending':
        default:
          return 'border-l-4 border-orange-500 bg-orange-900/20';
      }
    }

    const statusColor = {
      [CaseStatus.Assigned]: 'border-l-4 border-blue-500',
      [CaseStatus.InProgress]: 'border-l-4 border-yellow-500',
      [CaseStatus.Completed]: 'border-l-4 border-green-500',
    };

    return statusColor[caseData.status];
  };
  
  const verificationOutcomeOptions = useMemo(() => verificationOptionsMap[caseData.verificationType], [caseData.verificationType]);

  const formatDate = (isoString?: string) => {
    if (!isoString) return null;
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getTimestampInfo = () => {
      if (caseData.isSaved) {
          return { label: 'Saved', value: formatDate(caseData.savedAt) };
      }
      switch (caseData.status) {
          case CaseStatus.Assigned:
              return { label: 'Assigned', value: formatDate(caseData.createdAt) };
          case CaseStatus.InProgress:
              return { label: 'Started', value: formatDate(caseData.inProgressAt) };
          case CaseStatus.Completed:
              return { label: 'Completed', value: formatDate(caseData.completedAt) };
          default:
              return { label: 'Updated', value: formatDate(caseData.updatedAt) };
      }
  };

  const timestamp = getTimestampInfo();

  const renderOutcomeSelectionPrompt = () => (
    <View style={{
      alignItems: 'center',
      paddingVertical: 24,
      paddingHorizontal: 16,
      marginVertical: 16,
      backgroundColor: '#1F2937',
      borderRadius: 8,
      borderWidth: 2,
      borderColor: '#374151',
      borderStyle: 'dashed'
    }}>
      <Text style={{ color: '#00a950', marginBottom: 8, fontSize: 24 }}>📋</Text>
      <Text style={{ color: '#F9FAFB', fontWeight: '600', marginBottom: 4 }}>
        Select Verification Outcome
      </Text>
      <Text style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center' }}>
        Choose an outcome from the dropdown above to automatically open the verification form
      </Text>
    </View>
  );

  const renderFormContent = () => {
    if (caseData.verificationType === VerificationType.Residence) {
      switch (caseData.verificationOutcome) {
        case VerificationOutcome.PositiveAndDoorLocked:
          return caseData.residenceReport ? <PositiveResidenceForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading Residence Form...</Text>;
        case VerificationOutcome.ShiftedAndDoorLocked:
          return caseData.shiftedResidenceReport ? <ShiftedResidenceForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading Shifted Residence Form...</Text>;
        case VerificationOutcome.NSPAndDoorLocked:
          return caseData.nspResidenceReport ? <NspResidenceForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading NSP Residence Form...</Text>;
        case VerificationOutcome.ERT:
            return caseData.entryRestrictedResidenceReport ? <EntryRestrictedResidenceForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading Entry Restricted Form...</Text>;
        case VerificationOutcome.Untraceable:
            return caseData.untraceableResidenceReport ? <UntraceableResidenceForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading Untraceable Residence Form...</Text>;
        default:
            return renderOutcomeSelectionPrompt();
      }
    }

    if (caseData.verificationType === VerificationType.ResidenceCumOffice) {
        switch (caseData.verificationOutcome) {
            case VerificationOutcome.PositiveAndDoorLocked:
                return caseData.resiCumOfficeReport ? <PositiveResiCumOfficeForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading Resi-cum-Office Form...</Text>;
            case VerificationOutcome.ShiftedAndDoorLocked:
                return caseData.shiftedResiCumOfficeReport ? <ShiftedResiCumOfficeForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading Shifted Resi-cum-Office Form...</Text>;
            case VerificationOutcome.NSPAndDoorLocked:
                return caseData.nspResiCumOfficeReport ? <NspResiCumOfficeForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading NSP Resi-cum-Office Form...</Text>;
            case VerificationOutcome.ERT:
                return caseData.entryRestrictedResiCumOfficeReport ? <EntryRestrictedResiCumOfficeForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading ERT Resi-cum-Office Form...</Text>;
            case VerificationOutcome.Untraceable:
                return caseData.untraceableResiCumOfficeReport ? <UntraceableResiCumOfficeForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading Untraceable Resi-cum-Office Form...</Text>;
            default:
                return renderOutcomeSelectionPrompt();
        }
    }

    if (caseData.verificationType === VerificationType.Office) {
        switch (caseData.verificationOutcome) {
            case VerificationOutcome.PositiveAndDoorLocked:
                return caseData.positiveOfficeReport ? <PositiveOfficeForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading Office Form...</Text>;
            case VerificationOutcome.ShiftedAndDoorLocked:
                return caseData.shiftedOfficeReport ? <ShiftedOfficeForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading Shifted Office Form...</Text>;
            case VerificationOutcome.NSPAndDoorLocked:
                return caseData.nspOfficeReport ? <NspOfficeForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading NSP Office Form...</Text>;
            case VerificationOutcome.ERT:
                return caseData.entryRestrictedOfficeReport ? <EntryRestrictedOfficeForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading ERT Office Form...</Text>;
            case VerificationOutcome.Untraceable:
                return caseData.untraceableOfficeReport ? <UntraceableOfficeForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading Untraceable Office Form...</Text>;
            default:
                return renderOutcomeSelectionPrompt();
        }
    }

    if (caseData.verificationType === VerificationType.Business) {
        switch (caseData.verificationOutcome) {
            case VerificationOutcome.PositiveAndDoorLocked:
                return caseData.positiveBusinessReport ? <PositiveBusinessForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading Business Form...</Text>;
            case VerificationOutcome.ShiftedAndDoorLocked:
                return caseData.shiftedBusinessReport ? <ShiftedBusinessForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading Shifted Business Form...</Text>;
            case VerificationOutcome.NSPAndDoorLocked:
                return caseData.nspBusinessReport ? <NspBusinessForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading NSP Business Form...</Text>;
            case VerificationOutcome.ERT:
                return caseData.entryRestrictedBusinessReport ? <EntryRestrictedBusinessForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading ERT Business Form...</Text>;
            case VerificationOutcome.Untraceable:
                return caseData.untraceableBusinessReport ? <UntraceableBusinessForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading Untraceable Business Form...</Text>;
            default:
                return renderOutcomeSelectionPrompt();
        }
    }
    
    if (caseData.verificationType === VerificationType.Builder) {
        switch (caseData.verificationOutcome) {
            case VerificationOutcome.PositiveAndDoorLocked:
                return caseData.positiveBuilderReport ? <PositiveBuilderForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading Builder Form...</Text>;
            case VerificationOutcome.ShiftedAndDoorLocked:
                return caseData.shiftedBuilderReport ? <ShiftedBuilderForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading Shifted Builder Form...</Text>;
            case VerificationOutcome.NSPAndDoorLocked:
                return caseData.nspBuilderReport ? <NspBuilderForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading NSP Builder Form...</Text>;
            case VerificationOutcome.ERT:
                return caseData.entryRestrictedBuilderReport ? <EntryRestrictedBuilderForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading ERT Builder Form...</Text>;
            case VerificationOutcome.Untraceable:
                return caseData.untraceableBuilderReport ? <UntraceableBuilderForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading Untraceable Builder Form...</Text>;
            default:
                return renderOutcomeSelectionPrompt();
        }
    }

    if (caseData.verificationType === VerificationType.NOC) {
        switch (caseData.verificationOutcome) {
            case VerificationOutcome.PositiveAndDoorLocked:
                return caseData.positiveNocReport ? <PositiveNocForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading NOC Form...</Text>;
            case VerificationOutcome.ShiftedAndDoorLocked:
                return caseData.shiftedNocReport ? <ShiftedNocForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading Shifted NOC Form...</Text>;
            case VerificationOutcome.NSPAndDoorLocked:
                return caseData.nspNocReport ? <NspNocForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading NSP NOC Form...</Text>;
            case VerificationOutcome.ERT:
                return caseData.entryRestrictedNocReport ? <EntryRestrictedNocForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading ERT NOC Form...</Text>;
            case VerificationOutcome.Untraceable:
                return caseData.untraceableNocReport ? <UntraceableNocForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading Untraceable NOC Form...</Text>;
            default:
                return renderOutcomeSelectionPrompt();
        }
    }

    if (caseData.verificationType === VerificationType.Connector) {
        switch (caseData.verificationOutcome) {
            case VerificationOutcome.PositiveAndDoorLocked:
                return caseData.positiveDsaReport ? <PositiveDsaForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading DSA/DST Form...</Text>;
            case VerificationOutcome.ShiftedAndDoorLocked:
                return caseData.shiftedDsaReport ? <ShiftedDsaForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading Shifted DSA/DST Form...</Text>;
            case VerificationOutcome.NSPAndDoorLocked:
                return caseData.nspDsaReport ? <NspDsaForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading NSP DSA/DST Form...</Text>;
            case VerificationOutcome.ERT:
                return caseData.entryRestrictedDsaReport ? <EntryRestrictedDsaForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading ERT DSA/DST Form...</Text>;
            case VerificationOutcome.Untraceable:
                return caseData.untraceableDsaReport ? <UntraceableDsaForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading Untraceable DSA/DST Form...</Text>;
            default:
                return renderOutcomeSelectionPrompt();
        }
    }

    if (caseData.verificationType === VerificationType.PropertyAPF) {
        switch (caseData.verificationOutcome) {
            case VerificationOutcome.PositiveAndDoorLocked:
            case VerificationOutcome.NSPAndDoorLocked:
                return (caseData.positivePropertyApfReport || caseData.nspPropertyApfReport) ?
                    <PositiveNegativePropertyApfForm caseData={caseData} /> :
                    <Text style={{ color: '#9CA3AF' }}>Loading Property APF Form...</Text>;
            case VerificationOutcome.ERT:
                return caseData.entryRestrictedPropertyApfReport ? <EntryRestrictedPropertyApfForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading ERT Property (APF) Form...</Text>;
            case VerificationOutcome.Untraceable:
                return caseData.untraceablePropertyApfReport ? <UntraceablePropertyApfForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading Untraceable Property (APF) Form...</Text>;
            default:
                return renderOutcomeSelectionPrompt();
        }
    }

    if (caseData.verificationType === VerificationType.PropertyIndividual) {
        switch (caseData.verificationOutcome) {
            case VerificationOutcome.PositiveAndDoorLocked:
                return caseData.positivePropertyIndividualReport ? <PositivePropertyIndividualForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading Property (Individual) Form...</Text>;
            case VerificationOutcome.NSPAndDoorLocked:
                return caseData.nspPropertyIndividualReport ? <NspPropertyIndividualForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading NSP Property (Individual) Form...</Text>;
            case VerificationOutcome.ERT:
                return caseData.entryRestrictedPropertyIndividualReport ? <EntryRestrictedPropertyIndividualForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading ERT Property (Individual) Form...</Text>;
            case VerificationOutcome.Untraceable:
                return caseData.untraceablePropertyIndividualReport ? <UntraceablePropertyIndividualForm caseData={caseData} /> : <Text style={{ color: '#9CA3AF' }}>Loading Untraceable Property (Individual) Form...</Text>;
            default:
                return renderOutcomeSelectionPrompt();
        }
    }

    return (
        <Text style={{ color: '#9CA3AF', marginTop: 16 }}>No specific form for this verification type/outcome combination.</Text>
    );
  };


  return (
    <View style={{ flex: 1 }}>
    <View style={{
      backgroundColor: '#1F2937',
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      marginBottom: 16,
      marginHorizontal: 16,
      padding: 16,
      borderLeftWidth: 4,
      borderLeftColor: getStatusColor(),
      ...(hasAutoSaveData ? {
        borderWidth: 2,
        borderColor: '#FBBF24',
        backgroundColor: '#451A03'
      } : {})
    }}>
      <TouchableOpacity
        style={{
          flex: 1,
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}
        onPress={(caseData.status !== CaseStatus.Assigned && caseData.status !== CaseStatus.Completed && !caseData.isSaved) ? () => setIsExpanded(!isExpanded) : undefined}
        disabled={caseData.status === CaseStatus.Assigned || caseData.status === CaseStatus.Completed || caseData.isSaved}
      >
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: '#10B981' }}>{caseData.verificationType}</Text>
                    {hasAutoSaveData && (
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 12,
                        backgroundColor: 'rgba(251, 191, 36, 0.2)',
                        borderWidth: 1,
                        borderColor: 'rgba(251, 191, 36, 0.3)'
                      }}>
                        <Text style={{ fontSize: 12, fontWeight: '500', color: '#FCD34D' }}>📝 Draft Saved</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#F9FAFB' }}>{caseData.title}</Text>
              </View>
              {timestamp.value && (
                <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                  <Text style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'right' }}>{timestamp.label}</Text>
                  <Text style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'right' }}>{timestamp.value}</Text>
                </View>
              )}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <Text style={{ fontSize: 14, color: '#D1D5DB' }}>{caseData.customer.name} - {caseData.id}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {/* Show attachment button for In Progress cases */}
              {caseData.status === CaseStatus.InProgress && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    setIsAttachmentsModalOpen(true);
                  }}
                  style={{
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative'
                  }}
                >
                  <AttachmentIcon />
                  <Text style={{ fontSize: 12, marginTop: 4, color: '#A855F7' }}>Attachments</Text>
                  {attachmentCount > 0 && (
                    <View style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      backgroundColor: '#7C3AED',
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Text style={{ color: 'white', fontSize: 12 }}>{attachmentCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
              {/* Show priority input only for In Progress cases */}
              {caseData.status === CaseStatus.InProgress && !caseData.isSaved && (
                <PriorityInput caseId={caseData.id} />
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Show comprehensive timeline for completed cases */}
      {caseData.status === CaseStatus.Completed && (
        <CaseTimeline caseData={caseData} compact={true} />
      )}

      {/* Submission status and re-submit functionality for completed cases */}
      {caseData.status === CaseStatus.Completed && (
        <View style={{ marginTop: 12 }}>
          {/* Submission Status Indicator */}
          {caseData.submissionStatus && (
            <View style={{ marginBottom: 12 }}>
              {caseData.submissionStatus === 'success' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: '#10B981', fontSize: 14 }}>✅</Text>
                  <Text style={{ color: '#10B981', fontSize: 14 }}>Successfully submitted to server</Text>
                </View>
              )}

              {caseData.submissionStatus === 'failed' && (
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: '#EF4444', fontSize: 14 }}>❌</Text>
                    <Text style={{ color: '#EF4444', fontSize: 14 }}>Submission failed</Text>
                  </View>
                  {caseData.submissionError && (
                    <View style={{ padding: 8, borderRadius: 4, backgroundColor: 'rgba(239, 68, 68, 0.2)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                      <Text style={{ color: '#FCA5A5', fontSize: 12 }}>{caseData.submissionError}</Text>
                    </View>
                  )}
                </View>
              )}

              {caseData.submissionStatus === 'submitting' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: '#FBBF24', fontSize: 14 }}>⏳</Text>
                  <Text style={{ color: '#FBBF24', fontSize: 14 }}>Submitting to server...</Text>
                </View>
              )}

              {caseData.submissionStatus === 'pending' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: '#F97316', fontSize: 14 }}>⏸️</Text>
                  <Text style={{ color: '#F97316', fontSize: 14 }}>Pending submission</Text>
                </View>
              )}
            </View>
          )}

          {/* Submission Message */}
          {submissionMessage && (
            <View style={{
              marginBottom: 12,
              padding: 8,
              borderRadius: 4,
              backgroundColor: submissionMessage.includes('success') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              borderWidth: 1,
              borderColor: submissionMessage.includes('success') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
            }}>
              <Text style={{
                color: submissionMessage.includes('success') ? '#10B981' : '#EF4444',
                fontSize: 14
              }}>{submissionMessage}</Text>
            </View>
          )}

          {/* Re-submit Button */}
          {(caseData.submissionStatus === 'failed' || caseData.submissionStatus === 'pending' || caseData.isSaved) && (
            <TouchableOpacity
              onPress={caseData.submissionStatus === 'failed' ? handleResubmitCase : handleSubmitCase}
              disabled={isSubmitting}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 6,
                backgroundColor: isSubmitting ? 'rgba(37, 99, 235, 0.8)' : '#2563EB',
                opacity: isSubmitting ? 0.5 : 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8
              }}
            >
              {isSubmitting ? (
                <>
                  <Text style={{ color: 'white', fontSize: 14 }}>⏳</Text>
                  <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                    {caseData.submissionStatus === 'failed' ? 'Resubmitting...' : 'Submitting...'}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={{ color: 'white', fontSize: 14 }}>🔄</Text>
                  <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                    {caseData.submissionStatus === 'failed' ? 'Re-submit Case' : 'Submit Case'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={{
        maxHeight: isExpanded ? 8000 : 0,
        marginTop: isExpanded ? 16 : 0,
        overflow: 'hidden'
      }}>
          {isInProgress && verificationOutcomeOptions && (
              <View style={{ marginBottom: 16 }}>
                  <SelectField
                      label="Verification Outcome"
                      id={`outcome-${caseData.id}`}
                      name="verificationOutcome"
                      value={caseData.verificationOutcome || ''}
                      onChange={handleOutcomeChange}
                  >
                      <option value="">Select Outcome...</option>
                      {verificationOutcomeOptions}
                  </SelectField>
              </View>
          )}
          <ScrollView
            ref={formContentRef}
            style={{
              maxHeight: isExpanded ? 400 : 0
            }}
            showsVerticalScrollIndicator={true}
            onTouchStart={(e) => e.stopPropagation()}
          >
            {isFormExpanding ? (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 20
              }}>
                <Spinner size="small" />
                <Text style={{ marginLeft: 8, fontSize: 14, color: '#9CA3AF' }}>Opening form...</Text>
              </View>
            ) : (
              <View style={{
                paddingRight: 8,
                paddingBottom: 16,
                paddingTop: 8
              }}>
                {renderFormContent()}
                {isFormScrollable && (
                  <View style={{
                    alignItems: 'center',
                    padding: 8,
                    backgroundColor: '#1F2937'
                  }}>
                    <Text style={{ color: '#9CA3AF', fontSize: 12 }}>↓ Scroll down for more fields ↓</Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
      </View>

      {/* Action buttons and controls have been temporarily disabled for React Native compatibility */}
      
      {/* Modals have been temporarily disabled for React Native compatibility */}

      {/* Attachments Modal */}
      <AttachmentsModal
        caseId={caseData.id}
        isVisible={isAttachmentsModalOpen}
        onClose={() => setIsAttachmentsModalOpen(false)}
      />
      </View>
    </View>
  );
};

export default CaseCard;