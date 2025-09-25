import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../../components/AuthComponents';
import { useAuth } from '../../../context/AuthContext';

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

// Tag component for allergies, conditions, medications
const Tag = ({ text, onDelete }: { text: string; onDelete: () => void }) => (
  <View style={styles.tag}>
    <Text style={styles.tagText}>{text}</Text>
    <TouchableOpacity onPress={onDelete} style={styles.tagDeleteButton}>
      <Ionicons name="close-circle" size={16} color="#6b7280" />
    </TouchableOpacity>
  </View>
);

// Input field with tags
const TagInput = ({ 
  value, 
  onAddTag, 
  onDeleteTag, 
  placeholder 
}: { 
  value: string[]; 
  onAddTag: (tag: string) => void; 
  onDeleteTag: (index: number) => void; 
  placeholder: string;
}) => {
  const [input, setInput] = useState('');

  const handleAddTag = () => {
    if (input.trim()) {
      onAddTag(input.trim());
      setInput('');
    }
  };

  return (
    <View style={styles.tagInputContainer}>
      <View style={styles.tagInputRow}>
        <TextInput
          style={styles.tagInput}
          value={input}
          onChangeText={setInput}
          placeholder={placeholder}
          onSubmitEditing={handleAddTag}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddTag}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.tagsContainer}>
        {value.map((tag, index) => (
          <Tag 
            key={index} 
            text={tag} 
            onDelete={() => onDeleteTag(index)} 
          />
        ))}
      </View>
    </View>
  );
};

export default function EditMedicalInfoScreen() {
  const { userProfile, updateUserProfile } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize with existing medical info or empty arrays
  const [formData, setFormData] = useState({
    allergies: userProfile?.medicalInfo?.allergies || [],
    conditions: userProfile?.medicalInfo?.conditions || [],
    medications: userProfile?.medicalInfo?.medications || [],
    bloodType: userProfile?.medicalInfo?.bloodType || '',
    notes: userProfile?.medicalInfo?.notes || '',
  });
  
  const handleAddTag = (field: 'allergies' | 'conditions' | 'medications', tag: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], tag]
    }));
  };

  const handleDeleteTag = (field: 'allergies' | 'conditions' | 'medications', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleBloodTypeSelect = (bloodType: string) => {
    setFormData(prev => ({
      ...prev,
      bloodType
    }));
  };

  const handleNotesChange = (text: string) => {
    setFormData(prev => ({
      ...prev,
      notes: text
    }));
  };
  
  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      await updateUserProfile({
        medicalInfo: formData,
        hasAddedMedicalInfo: true,
        updatedAt: Date.now(),
      });
      
      Alert.alert('Success', 'Medical information updated successfully');
      // Navigate back to profile page
      router.replace('/tabs/profile' as any);
    } catch (error) {
      // @ts-ignore
      Alert.alert('Error', error.message || 'Failed to update medical information');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Edit Medical Information',
          headerShown: true,
          headerTitleAlign: 'center',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.push('/tabs/profile' as any)}
              style={{ paddingHorizontal: 16 }}
            >
              <Ionicons name="arrow-back" size={24} color="#0284c7" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Medical Information</Text>
            
            <Text style={styles.fieldLabel}>Allergies</Text>
            <TagInput 
              value={formData.allergies}
              onAddTag={(tag) => handleAddTag('allergies', tag)}
              onDeleteTag={(index) => handleDeleteTag('allergies', index)}
              placeholder="Add allergy and press enter"
            />
            
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Medical Conditions</Text>
            <TagInput 
              value={formData.conditions}
              onAddTag={(tag) => handleAddTag('conditions', tag)}
              onDeleteTag={(index) => handleDeleteTag('conditions', index)}
              placeholder="Add condition and press enter"
            />
            
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Medications</Text>
            <TagInput 
              value={formData.medications}
              onAddTag={(tag) => handleAddTag('medications', tag)}
              onDeleteTag={(index) => handleDeleteTag('medications', index)}
              placeholder="Add medication and press enter"
            />
            
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Blood Type</Text>
            <View style={styles.optionsContainer}>
              {bloodTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.optionButton,
                    formData.bloodType === type && styles.selectedOption
                  ]}
                  onPress={() => handleBloodTypeSelect(type)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.bloodType === type && styles.selectedOptionText
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Additional Notes</Text>
            <TextInput
              style={styles.notesInput}
              value={formData.notes}
              onChangeText={handleNotesChange}
              placeholder="Any additional medical information..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <View style={styles.noteContainer}>
              <Ionicons name="information-circle" size={20} color="#6b7280" />
              <Text style={styles.noteText}>
                This information will only be shared with emergency services when you use safety features.
              </Text>
            </View>
            
            <Button
              title={isLoading ? 'Saving...' : 'Save Changes'}
              onPress={handleSave}
              disabled={isLoading}
              style={styles.saveButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  tagInputContainer: {
    marginBottom: 8,
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#0284c7',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#4b5563',
    fontSize: 14,
    marginRight: 4,
  },
  tagDeleteButton: {
    marginLeft: 4,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  optionText: {
    color: '#4b5563',
    fontSize: 14,
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: '500',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
  },
  noteContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 24,
  },
  noteText: {
    flex: 1,
    marginLeft: 8,
    color: '#6b7280',
    fontSize: 14,
  },
  saveButton: {
    marginBottom: 16,
  },
});