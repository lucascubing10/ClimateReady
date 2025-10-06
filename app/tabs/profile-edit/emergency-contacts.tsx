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
  ScrollView
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { InputField, Button } from '../../../components/AuthComponents';
import { useAuth } from '../../../context/AuthContext';

// Screen: manage the user’s emergency contacts used during SOS dispatches.
export default function EditEmergencyContactsScreen() {
  const { userProfile, updateUserProfile } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize contacts from user profile or with an empty array
  const [contacts, setContacts] = useState(() => {
    // Ensure we're working with a valid array
    if (userProfile?.emergencyContacts && Array.isArray(userProfile.emergencyContacts)) {
      console.log('Loading emergency contacts:', JSON.stringify(userProfile.emergencyContacts));
      return [...userProfile.emergencyContacts];
    }
    return [];
  });
  
  // State for the currently edited contact
  const [editingIndex, setEditingIndex] = useState(-1); // -1 means adding new
  
  // Form data for the current contact being edited
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    relationship: '',
    email: '',
  });
  
  // Form validation errors
  const [errors, setErrors] = useState({
    name: '',
    phoneNumber: '',
    relationship: '',
    email: '',
  });
  
  // Edit an existing contact
  const startEditing = (index: number) => {
    setEditingIndex(index);
    setFormData({
      name: contacts[index].name,
      phoneNumber: contacts[index].phoneNumber,
      relationship: contacts[index].relationship,
      email: contacts[index].email || '',
    });
    setErrors({
      name: '',
      phoneNumber: '',
      relationship: '',
      email: '',
    });
  };
  
  // Start adding a new contact
  const startAddingContact = () => {
    setEditingIndex(-1);
    setFormData({
      name: '',
      phoneNumber: '',
      relationship: '',
      email: '',
    });
    setErrors({
      name: '',
      phoneNumber: '',
      relationship: '',
      email: '',
    });
  };
  
  // Handle form field changes
  // Keep form state and inline errors in sync as the user edits.
  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  // Validate the form
  // Validate required fields and run basic formatting checks.
  const validateForm = () => {
    const newErrors = { ...errors };
    let isValid = true;
    
    if (!formData.name.trim()) {
      newErrors.name = 'Contact name is required';
      isValid = false;
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Contact phone number is required';
      isValid = false;
    } else if (!/^\+?\d{10,15}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
      isValid = false;
    }
    
    if (!formData.relationship.trim()) {
      newErrors.relationship = 'Relationship is required';
      isValid = false;
    }
    
    // Email validation if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Save the current contact (add new or update existing) and save to database
  // Add a new entry or update an existing one, then persist the result.
  const saveContact = async () => {
    if (!validateForm()) return;
    
    const newContact = {
      name: formData.name,
      phoneNumber: formData.phoneNumber,
      relationship: formData.relationship,
      email: formData.email,
    };
    
    let updatedContactsList;
    
    if (editingIndex === -1) {
      // Add new contact
      updatedContactsList = [...contacts, newContact];
    } else {
      // Update existing contact
      updatedContactsList = [...contacts];
      updatedContactsList[editingIndex] = newContact;
    }
    
    // First update the local state for immediate UI feedback
    setContacts(updatedContactsList);
    
    // Then save to database
    try {
      setIsLoading(true);
      
      await updateUserProfile({
        emergencyContacts: updatedContactsList,
        hasAddedEmergencyContact: updatedContactsList.length > 0,
        updatedAt: Date.now(),
      });
      
      // Show a brief success message
      Alert.alert('Success', 'Emergency contact saved successfully');
      
      // Reset form for adding another contact
      startAddingContact();
    } catch (error) {
      console.error('Error saving contact:', error);
      // @ts-ignore
      Alert.alert('Error', error.message || 'Failed to save emergency contact');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Remove a contact and save changes to database
  // Confirm with the user before deleting and syncing to Firestore.
  const removeContact = (index: number) => {
    Alert.alert(
      'Remove Contact',
      'Are you sure you want to remove this emergency contact?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              // Update local state
              const updatedContacts = [...contacts];
              updatedContacts.splice(index, 1);
              setContacts(updatedContacts);
              
              // Save to database
              await updateUserProfile({
                emergencyContacts: updatedContacts,
                hasAddedEmergencyContact: updatedContacts.length > 0,
                updatedAt: Date.now(),
              });
              
              Alert.alert('Success', 'Emergency contact removed successfully');
            } catch (error) {
              console.error('Error removing contact:', error);
              // @ts-ignore
              Alert.alert('Error', error.message || 'Failed to remove emergency contact');
            } finally {
              setIsLoading(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };
  
  // We've removed the handleSave function since we now save changes immediately
  // when adding, editing, or removing contacts
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Emergency Contacts',
          headerShown: true,
          headerTitleAlign: 'center',
          // Provide an explicit back affordance instead of relying on native gestures.
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
          {/* List of existing contacts */}
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Your Emergency Contacts</Text>
            <Text style={styles.subTitle}>Changes are saved automatically</Text>
            
            {contacts.length === 0 ? (
              <Text style={styles.noContactsText}>No emergency contacts added yet.</Text>
            ) : (
              contacts.map((contact, index) => (
                <View key={index} style={styles.contactCard}>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactDetail}>
                      <Ionicons name="call-outline" size={14} color="#6b7280" /> {contact.phoneNumber}
                    </Text>
                    <Text style={styles.contactDetail}>
                      <Ionicons name="people-outline" size={14} color="#6b7280" /> {contact.relationship}
                    </Text>
                    {contact.email && (
                      <Text style={styles.contactDetail}>
                        <Ionicons name="mail-outline" size={14} color="#6b7280" /> {contact.email}
                      </Text>
                    )}
                  </View>
                  <View style={styles.contactActions}>
                    <TouchableOpacity 
                      onPress={() => startEditing(index)}
                      style={styles.editButton}
                    >
                      <Ionicons name="pencil" size={18} color="#0284c7" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => removeContact(index)}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="trash" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
            
            <TouchableOpacity
              style={styles.addContactButton}
              onPress={startAddingContact}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#0284c7" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={20} color="#0284c7" />
                  <Text style={styles.addContactText}>Add New Contact</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Form for adding/editing contacts */}
          {editingIndex > -1 && (
            <View style={[styles.formContainer, { marginTop: 16 }]}>
              <Text style={styles.sectionTitle}>Edit Contact</Text>
              <InputField
                label="Full Name"
                value={formData.name}
                onChangeText={(text) => handleChange('name', text)}
                placeholder="Contact Name"
                error={errors.name}
                required
                leftIcon={<Ionicons name="person-outline" size={20} color="#9ca3af" />}
              />
              
              <InputField
                label="Phone Number"
                value={formData.phoneNumber}
                onChangeText={(text) => handleChange('phoneNumber', text)}
                placeholder="Contact Phone Number"
                keyboardType="phone-pad"
                error={errors.phoneNumber}
                required
                leftIcon={<Ionicons name="call-outline" size={20} color="#9ca3af" />}
              />
              
              <InputField
                label="Relationship"
                value={formData.relationship}
                onChangeText={(text) => handleChange('relationship', text)}
                placeholder="e.g. Parent, Spouse, Friend"
                error={errors.relationship}
                required
                leftIcon={<Ionicons name="people-outline" size={20} color="#9ca3af" />}
              />
              
              <InputField
                label="Email (Optional)"
                value={formData.email}
                onChangeText={(text) => handleChange('email', text)}
                placeholder="contact@example.com"
                keyboardType="email-address"
                error={errors.email}
              />
              
              <Button
                title={isLoading ? "Saving..." : "Save Contact"}
                onPress={saveContact}
                disabled={isLoading}
                style={styles.buttonMargin}
              />
              
              <Button
                title="Cancel"
                onPress={() => startAddingContact()}
                variant="outline"
                style={styles.buttonMargin}
                disabled={isLoading}
              />
            </View>
          )}
          
          {editingIndex === -1 && (
            <View style={[styles.formContainer, { marginTop: 16 }]}>
              <Text style={styles.sectionTitle}>Add New Contact</Text>
              <InputField
                label="Full Name"
                value={formData.name}
                onChangeText={(text) => handleChange('name', text)}
                placeholder="Contact Name"
                error={errors.name}
                required
                leftIcon={<Ionicons name="person-outline" size={20} color="#9ca3af" />}
              />
              
              <InputField
                label="Phone Number"
                value={formData.phoneNumber}
                onChangeText={(text) => handleChange('phoneNumber', text)}
                placeholder="Contact Phone Number"
                keyboardType="phone-pad"
                error={errors.phoneNumber}
                required
                leftIcon={<Ionicons name="call-outline" size={20} color="#9ca3af" />}
              />
              
              <InputField
                label="Relationship"
                value={formData.relationship}
                onChangeText={(text) => handleChange('relationship', text)}
                placeholder="e.g. Parent, Spouse, Friend"
                error={errors.relationship}
                required
                leftIcon={<Ionicons name="people-outline" size={20} color="#9ca3af" />}
              />
              
              <InputField
                label="Email (Optional)"
                value={formData.email}
                onChangeText={(text) => handleChange('email', text)}
                placeholder="contact@example.com"
                keyboardType="email-address"
                error={errors.email}
                leftIcon={<Ionicons name="mail-outline" size={20} color="#9ca3af" />}
              />
              
              <Button
                title={isLoading ? "Saving..." : "Save Contact"}
                onPress={saveContact}
                disabled={isLoading}
                style={styles.buttonMargin}
              />
            </View>
          )}
          
          {/* Note about emergency contacts */}
          <View style={[styles.formContainer, { marginTop: 16 }]}>
            <View style={styles.noteContainer}>
              <Ionicons name="information-circle" size={20} color="#6b7280" />
              <Text style={styles.noteText}>
                Emergency contacts will be notified in crisis situations when you use safety features.
              </Text>
            </View>
            
            <Button
              title="Back to Profile"
              onPress={() => router.push('/tabs/profile' as any)}
              variant="outline"
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
  buttonMargin: {
    marginTop: 10,
  },
  content: {
    padding: 20,
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
  formMarginTop: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    fontStyle: 'italic',
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
  noContactsText: {
    textAlign: 'center',
    color: '#6b7280',
    fontStyle: 'italic',
    padding: 12,
  },
  contactCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  contactDetail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  addContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 8,
  },
  addContactText: {
    color: '#0284c7',
    fontWeight: '500',
    marginLeft: 8,
  },
});