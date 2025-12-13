import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Save } from 'lucide-react';
import { toast } from 'sonner';
import { emergencyApi } from '@/lib/api';

interface MedicalInfoType {
  blood_type?: string;
  allergies?: string;
  medications?: string;
  conditions?: string;
  emergency_notes?: string;
}

export default function MedicalInfo() {
  const [medicalInfo, setMedicalInfo] = useState<MedicalInfoType>({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchMedicalInfo();
  }, []);

  const fetchMedicalInfo = async () => {
    try {
      const response = await emergencyApi.getMedicalInfo();
      setMedicalInfo(response);
    } catch (error) {
      toast.error('Failed to fetch medical info');
    }
  };

  const handleSave = async () => {
    try {
      await emergencyApi.updateMedicalInfo(medicalInfo);
      toast.success('Medical information saved successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to save medical info');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Medical Information
        </CardTitle>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="blood_type">Blood Type</Label>
          <Input
            id="blood_type"
            value={medicalInfo.blood_type || ''}
            onChange={(e) => setMedicalInfo({ ...medicalInfo, blood_type: e.target.value })}
            disabled={!isEditing}
            placeholder="e.g., A+, O-, AB+"
          />
        </div>

        <div>
          <Label htmlFor="allergies">Allergies</Label>
          <Textarea
            id="allergies"
            value={medicalInfo.allergies || ''}
            onChange={(e) => setMedicalInfo({ ...medicalInfo, allergies: e.target.value })}
            disabled={!isEditing}
            placeholder="List any allergies (food, medication, etc.)"
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="medications">Current Medications</Label>
          <Textarea
            id="medications"
            value={medicalInfo.medications || ''}
            onChange={(e) => setMedicalInfo({ ...medicalInfo, medications: e.target.value })}
            disabled={!isEditing}
            placeholder="List current medications and dosages"
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="conditions">Medical Conditions</Label>
          <Textarea
            id="conditions"
            value={medicalInfo.conditions || ''}
            onChange={(e) => setMedicalInfo({ ...medicalInfo, conditions: e.target.value })}
            disabled={!isEditing}
            placeholder="List any medical conditions (diabetes, asthma, etc.)"
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="emergency_notes">Emergency Notes</Label>
          <Textarea
            id="emergency_notes"
            value={medicalInfo.emergency_notes || ''}
            onChange={(e) =>
              setMedicalInfo({
                ...medicalInfo,
                emergency_notes: e.target.value,
              })
            }
            disabled={!isEditing}
            placeholder="Any additional information first responders should know"
            rows={3}
          />
        </div>

        {isEditing && (
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                fetchMedicalInfo();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
