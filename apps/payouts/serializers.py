from django.utils import timezone
from rest_framework import serializers

from apps.payouts.models import Invoice, Payout, PayoutConfig, PayoutMilestone, PayoutType


class PayoutTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayoutType
        fields = ["id", "name", "description", "type_code", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["client"] = request.client
        return super().create(validated_data)


class PayoutMilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayoutMilestone
        fields = [
            "id", "payout_config", "name", "description", "amount",
            "trigger_condition", "status", "achieved_at", "paid_at",
        ]
        read_only_fields = ["id"]


class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = [
            "id", "payout", "invoice_number", "amount", "tax", "total",
            "generated_at", "pdf_url",
            "gstin", "cgst", "sgst", "igst", "place_of_supply",
            "hsn_sac_code", "tds_deducted", "tds_certificate_url",
        ]
        read_only_fields = ["id", "invoice_number", "generated_at"]


class PayoutSerializer(serializers.ModelSerializer):
    requested_by_name = serializers.CharField(source="requested_by.full_name", read_only=True)
    approved_by_name = serializers.CharField(source="approved_by.full_name", read_only=True)
    invoice = InvoiceSerializer(read_only=True)

    class Meta:
        model = Payout
        fields = [
            "id", "payout_config", "milestone", "amount", "status",
            "requested_by", "requested_by_name", "approved_by", "approved_by_name",
            "requested_at", "approved_at", "paid_at", "reference_number",
            "notes", "invoice",
            # Tax fields
            "tds_section", "tds_rate", "tds_amount",
            "gst_applicable", "gst_rate", "gst_amount", "net_payable",
            # Payment fields
            "payment_mode", "utr_number", "paid_date",
        ]
        read_only_fields = ["id", "requested_by", "approved_by", "requested_at", "approved_at", "paid_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["requested_by"] = getattr(request, "employee", None)
        return super().create(validated_data)


class PayoutApproveSerializer(serializers.Serializer):
    notes = serializers.CharField(required=False, default="")

    def validate(self, attrs):
        payout = self.context.get("payout")
        if payout.status != Payout.Status.PENDING:
            raise serializers.ValidationError("Only pending payouts can be approved.")
        return attrs

    def save(self):
        payout = self.context["payout"]
        request = self.context["request"]
        payout.status = Payout.Status.APPROVED
        payout.approved_by = getattr(request, "employee", None)
        payout.approved_at = timezone.now()
        payout.notes = self.validated_data.get("notes", payout.notes)
        payout.save(update_fields=["status", "approved_by", "approved_at", "notes", "updated_at"]
                     if hasattr(payout, "updated_at") else ["status", "approved_by", "approved_at", "notes"])
        return payout


class PayoutConfigSerializer(serializers.ModelSerializer):
    milestones = PayoutMilestoneSerializer(many=True, read_only=True)
    payouts = PayoutSerializer(many=True, read_only=True)

    class Meta:
        model = PayoutConfig
        fields = [
            "id", "campaign_creator", "payout_type", "total_amount", "currency",
            "terms", "is_active", "milestones", "payouts", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
